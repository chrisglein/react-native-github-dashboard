import React, {Component} from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
} from 'react-native';

import { RepoUrls } from './RepoUrl'
import { Page } from './Page'
import { CollapsableHeader } from './Collapsable'

import AsyncStorage from '@react-native-async-storage/async-storage';

import {name as appName} from '../app.json';

class GitHubQuery extends Component {
  constructor(props) {
    super(props);
    this.state = {
      repoUrls: [
        'microsoft/react-native-windows',
        'microsoft/react-native-windows-samples',
        'microsoft/react-native-gallery',
        'microsoft/react-native-dualscreen',
        'microsoft/react-native-xaml',
      ],
      settings: {
        showLabels: true,
        collapseUnassigned: props.queryParams.issueType !== 'pull_request',
      },
      issues: [],
    };
  }

  getDateSuffix() {
    let currentDate = new Date();
    currentDate.setMinutes(0);
    currentDate.setMilliseconds(0);

    // With date with hour in the key this means we would requery once/hour.
    // By changing that result we can update less (e.g. twice/hour)
    let hoursBetweenUpdates = 2;
    let quantizedHours = (Math.ceil(currentDate.getHours() / hoursBetweenUpdates) * hoursBetweenUpdates);
    // Note: Months are 0-based (0==January, which is confusing when read in the logs)
    return `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}--${quantizedHours}`;
  }

  // Only bring over the values from the json that we care about, otherwise we
  // will very quickly hit the cache limits for how much a web page can store.
  trimPageData(pageData) {
    let newPageData = pageData.map(issue => {
      return Object.keys(issue).reduce((newIssue, key) => {
        const knownKeys = ['assignee', 'html_url', 'id', 'labels', 'milestone', 'number', 'pull_request', 'title', 'url'];
        if (knownKeys.includes(key)) {
          newIssue[key] = issue[key];
        }
        return newIssue;
      }, {});
    });
    return newPageData;
  }

  processIssue(issue) {
    let issueAssignee = issue.assignee;
    let assignee = 'unassigned';
    if (issueAssignee) {
      assignee = issueAssignee.login;
    }
    let milestone = {};
    if (issue.milestone) {
      milestone.id = issue.milestone.id;
      milestone.title = issue.milestone.title;
      if (issue.milestone.due_on) {
        milestone.dueDate = new Date(issue.milestone.due_on);
      } else {
        milestone.dueDate = new Date(8640000000000000);
      }
    } else {
      milestone.id = 0;
      milestone.title = 'unscheduled';
      milestone.dueDate = new Date(8640000000000000);
    }
    let labels = issue.labels.map(value => {
      return {
        id: value.id,
        name: value.name,
        color: value.color,
        url: value.url, // TODO: This should be the html url, not the api url
      };
    });
    let issueType = (issue['pull_request'] !== undefined ? 'pull_request' : 'issue');
    return {
      id: issue.id,
      number: issue.number,
      url: issue.url,
      title: issue.title,
      assignee: assignee,
      url: issue.html_url,
      labels: labels,
      milestone: milestone,
      issueType: issueType,
    };
  }

  parseLinkHeader(request) {
    let header = request.getResponseHeader("link");

    if (!header) {
      console.warn('Missing link header');
      return {};
    }
    let matches = [...header.matchAll(/<(.+?)page=(\d+)>;\s*rel="(\w+)",*/g)];

    return matches.reduce((linkHeaders, match) => {
      linkHeaders[match[3]] = {
        linkType: match[3],
        baseUri: match[1],
        pageNumber: match[2]
      };
      return linkHeaders;
    }, {});
  }

  async clearCache() {
    let ableToClearIndividually = true;
    let keys = [];
    try {
      keys = await AsyncStorage.getAllKeys();
    } catch(e) {
      console.log('Error getting cache keys');
      console.log(e);
      ableToClearIndividually = false;
    }

    keys.forEach(async (key) => {
      try {
        await AsyncStorage.removeItem(key);
        console.info(`Removed from cache ${key}`);
      } catch(e) {
        console.log(`Error removing ${key}`);
        console.log(e);
        ableToClearIndividually = false;
      }
    });

    if (!ableToClearIndividually) {
      try {
        await AsyncStorage.clear();
      } catch(e) {
        console.log('Error clearing all cache');
        console.log(e);
      }
    }

    await this.queryAllIssues();
  }

  isPageDataValid(pageData) {
    if (pageData === undefined) {
      console.warn(`No page data`);
      return false;
    } 
    if (pageData.data === undefined) {
      console.warn(`Malformed page data`);
      console.log(pageData);
      return false;
    }
    if (!Array.isArray(pageData.data)) {
      console.warn('Non-array page data');
      console.log(pageData);
      return false;
    }
    if (pageData.data.length === 0) {
      console.warn('Empty page data');
      console.log(pageData);
      return false;
    }
    return true;
  }

  async queryIssues(repoUrl, pageNumber, keysByDate) {
    let uri = `https://api.github.com/repos/${repoUrl}/issues?state=open&sort=updated&direction=desc&page=${pageNumber}`;
    let pageIdWithoutDate = `${repoUrl}#${pageNumber}`;
    let idealDateKey = this.getDateSuffix();
    let pageId = `${pageIdWithoutDate}\@${idealDateKey}`;
    console.log(pageId);

    // Issue #71: See how many cached entries should exist
    // Load the previous one only (delete any older)
    // But only treat the current date as real
    // Use the previous data to know when an issue is
    // - new (doesn't appear in older data set)
    // - gone (only appears in older data set)
    let storedValueKeyExists = undefined;
    let keys = keysByDate[pageIdWithoutDate];
    if (keys) {
      keys.forEach(key => {
        if (key === idealDateKey) {
          console.log(`Cache should exist for ${pageId} at ${idealDateKey}`);
          storedValueKeyExists = idealDateKey;
        }
      });
      if (!storedValueKeyExists) {
        let mostRecentKey = keys[0];
        console.log(`Cached values found as ${mostRecentKey}, but not recent enough as ${idealDateKey}`);
        // Disabling this until logic is built to save old state separately
        // NOTE: If this is the first page this is okay, but all other pages should fallback so queries don't mix :/
        //storedValueKeyExists = mostRecentKey;
      }
    }

    let storedValue = undefined;
    if (storedValueKeyExists) {
      pageId = `${pageIdWithoutDate}\@${storedValueKeyExists}`;
      try {
        storedValue = await AsyncStorage.getItem(pageId);
      } catch(e) {
        console.log(`Failed to find cache value for ${pageId}`);
      }
    }

    return new Promise((resolve, reject) => {
      try {
        if (storedValue) {
          let storedJSONValue = JSON.parse(storedValue);
          console.info(`Found cached value for ${pageId}`);

          if (this.isPageDataValid(storedJSONValue)) {
            resolve(storedJSONValue);
            return;
          } else {
            console.warn(`Invalid cached value for ${pageId}`);
            console.log(storedValue);
          }
        }
      } catch(e) {
        console.warn(`Error parsing cached value for ${pageId}`);
        console.log(e);
        console.log(storedValue);
      }

      let request = new XMLHttpRequest();
      request.onload = () => {
        console.info(`Handling query results for ${pageId}`);
        let parsedData;
        try {
          parsedData = JSON.parse(request.responseText);
        } catch (e) {
          console.warn(`Error parsing json for ${pageId}`);
          console.log(e);
          console.log(request.responseText);
          reject();
          return;
        }

        // Trim down the data so we don't need to save off as much
        parsedData = this.trimPageData(parsedData);

        let pageData = {
          data: parsedData,
          linkHeaders: this.parseLinkHeader(request)
        }

        resolve(pageData);

        try {
          AsyncStorage.setItem(pageId, JSON.stringify(pageData)).then(
            () => {
              console.info(`Saved cached value for ${pageId}`);
            }, (e) => {
              console.log(`Error caching value for ${pageId}`);
              console.log(e);
              console.log(pageData);
            });
        } catch (e) {
          console.log(`Error starting to cache value for ${pageId}`);
          console.log(e);
        }
      };
      request.onerror = () => {
        console.log(`Error fetching ${pageId}`);
        reject();
      };
      request.open(
        'get',
        uri,
        true,
      );
      console.info(`Sending web request for ${pageId}: ${uri}`);
      request.setRequestHeader('User-Agent', appName);
      request.send();
    });
  }

  async queryAllIssues() {
    console.time("queryAllIssues");
    this.setState({
      issues: [],
      progress: 0.0,
    });

    // What cache values might we already have?
    let keys = [];
    try {
      keys = await AsyncStorage.getAllKeys();
    } catch(e) {
      console.log('Error getting cache keys');
      console.log(e);
    }
    console.log("Keys");
    console.log(keys);

    // Get all the different date entries for the same page
    let keysByDate = keys.reduce((keysByDate, key) => {
      let regex = new RegExp("(.+)\@(.+--.+)");
      let matches = key.match(regex);
      if (matches) {
        let mainKey = matches[1];
        let date = matches[2];

        let existing = keysByDate[mainKey];
        if (!existing) {
          existing = [];
        }

        keysByDate[mainKey] = [date, ...existing];
      } else {
        console.warn(`Key did not match date format: '${key}'`);
        let existing = keysByDate[key];
        if (!existing) {
          existing = [];
        }
        keysByDate[key] = [this.getDateSuffix(), ...existing];
      }
      return keysByDate;
    }, {});
    console.log("Keys by date");
    console.log(keysByDate);

    let issues = [];
    let pagesCompleted = 0;
    let totalPages = 0;

    const processPage = (pageData) => {
      if (this.isPageDataValid(pageData)) {
        let pageNumber;
        if (pageData.linkHeaders.next) {
          pageNumber = parseInt(pageData.linkHeaders.next.pageNumber) - 1;
        } else if (pageData.linkHeaders.prev) {
          pageNumber = parseInt(pageData.linkHeaders.prev.pageNumber) + 1;
        }
        console.info(`Processing page #${pageNumber} (${pagesCompleted} of ${totalPages})`);
        let pageIssues = pageData.data.map(current => this.processIssue(current));

        // Build a lookup table of issue ids
        // TODO: There's no need to redo this work per page
        let issuesById = issues.reduce((issuesById, issue) => {
          if (issuesById[issue.id] === undefined) {
            issuesById[issue.id] = issue;
          } else {
            console.warn(`Issues list should not contain duplicates: ${issue.id}`);
            console.log(issue);
          }
          return issuesById;
        }, {});

        // Append new issues to the list, but only if they are unique
        // (duplicate issue ids will cause problems later)
        pageIssues.forEach((issue) => {
          if (issuesById[issue.id] !== undefined) { 
            console.warn(`New page of issues contains already existing issue ${issue.id}`);
          } else {
            issues.push(issue);
            issuesById[issue.id] = issue;
          }
        })
      }
      pagesCompleted++;
      let progress = pagesCompleted / totalPages;
  
      if (pagesCompleted >= totalPages) {
        console.timeEnd("queryAllIssues");
        this.setState({
          progress: progress,
          issues: issues,
        });
      } else {
        this.setState({
          progress: progress,
        });
      }
    }

    console.info('Querying urls:');
    console.info(this.state.repoUrls);

    // Query for the first page of data, which has first/last page information
    // (so we can display accurate progress)
    let firstPageData = [];
    for (let index = 0; index < this.state.repoUrls.length; index++) {
      let firstPage = await this.queryFirstPage(this.state.repoUrls[index], keysByDate);
      firstPageData.push(firstPage);
      totalPages += firstPage.lastPageNumber;
    }

    // Once we have that data, go through it and actually add each page's payload to the list of issues
    for (let index = 0; index < this.state.repoUrls.length; index++) {
      let firstPage = firstPageData[index];
      await this.queryAllPages(
        this.state.repoUrls[index],
        firstPage.lastPageNumber,
        firstPage.firstPageData,
        keysByDate,
        (pageData) => {
          processPage(pageData);
        });
    }
  }

  async queryFirstPage(repoUrl, keysByDate) {
    console.info(`Trying first page for ${repoUrl}`);
    let firstPageData = undefined;
    try {
      firstPageData = await this.queryIssues(repoUrl, 1, keysByDate);
    } catch(e) {
      console.log(`Error getting first page`);
      console.log(e);
      return {lastPageNumber: 0, firstPageData: {}};
    }

    if (!this.isPageDataValid(firstPageData)) {
      return {lastPageNumber: 0, firstPageData: {}};
    } 

    let lastPageNumber = firstPageData.linkHeaders.last ? parseInt(firstPageData.linkHeaders.last.pageNumber): 1;
    console.info(`Last page # is ${lastPageNumber}`);
    return {lastPageNumber, firstPageData};
  }

  async queryAllPages(repoUrl, lastPageNumber, firstPageData, keysByDate, callback) {
    console.info(`Querying all pages for ${repoUrl}`);

    // We already have the data for the first page
    callback(firstPageData);

    // Go fetch all the remaining pages in parallel
    for (let parallelPageNumber = 2; parallelPageNumber <= lastPageNumber; parallelPageNumber++) {
      console.info(`Querying page ${parallelPageNumber}/${lastPageNumber} for ${repoUrl}`);
      this.queryIssues(repoUrl, parallelPageNumber, keysByDate).then((result) => {
        callback(result);
      });
    }
  }

  async componentDidMount() {
    this.queryAllIssues();
  }

  render() {
    return (
      <>
        <Page
          issues={this.state.issues}
          queryParams={this.props.queryParams}
          settings={this.state.settings}
          settingsUI={
            <View>
              <RepoUrls
                urls={this.state.repoUrls}
                clearCache={() => {
                  this.clearCache();
                }}
                onUrlsChanged={urls => {
                  this.setState({
                    repoUrls: urls,
                  }, () => this.queryAllIssues());
                }}
                refreshQuery={() => {
                  this.queryAllIssues();
                }}/>
                <View style={{flexDirection: 'row'}}>
                  <Switch
                    value={this.state.settings.showLabels}
                    onValueChange={newValue => {
                      let newSettings = {...this.state.settings, ...{showLabels: newValue}};
                      this.setState({settings: newSettings});
                      }}/>
                  <Text>Show labels on issues?</Text>
                </View>
                <View style={{flexDirection: 'row'}}>
                  <Switch
                    value={this.state.settings.collapseUnassigned}
                    onValueChange={newValue => {
                      let newSettings = {...this.state.settings, ...{collapseUnassigned: newValue}};
                      this.setState({settings: newSettings});
                      }}/>
                  <Text>Default collapse unassigned groups?</Text>
                </View>
            </View>
            
          }/>
        {(this.state.progress < 1.0) &&
          <View style={styles.loading}>
            <ActivityIndicator size='large'/>
          </View>
        }
      </>
    );
  }
}

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
});

export { GitHubQuery };
