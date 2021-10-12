import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Linking,
  SectionList,
} from 'react-native';

import {
  Label,
} from './Label'

const Issue = (props) => {
  if (props.settings.showLabels) {
    return (
      <View style={styles.issue}>
        <TouchableHighlight
          accessibilityRole='link'
          href={props.item.url}
          onPress={() => {Linking.openURL(props.item.url)}}>
          <View style={styles.issueNumberContainer}>
            <Text style={styles.issueNumber}>{props.item.number}</Text>
          </View>
        </TouchableHighlight>
        <Text style={styles.issueTitle}>{props.item.title}</Text>
        {props.item.labels.map(label => (
          <View key={label.id} style={styles.labelListItem}>
            <Label label={label}/>
          </View>
        ))}
      </View>
    );
  } else {
    return (
      <TouchableHighlight
        accessibilityRole='link'
        href={props.item.url}
        onPress={() => {Linking.openURL(props.item.url)}}>
        <Text style={styles.issueTitle}>{props.item.title}</Text>
      </TouchableHighlight>
    );
  }
}

class IssueList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: props.settings.collapseUnassigned && props.assignee === 'unassigned',
    }
  }

  render() {
    let sectionsMap = this.props.list.reduce((groupedByMilestone, issue) => {
      let group = groupedByMilestone[issue.milestone.title];
      if (group === undefined) {
        group = groupedByMilestone[issue.milestone.title] = {
          milestone: issue.milestone,
          key: issue.milestone.title,
          data: [],
        };
      }
      group.data.push(issue);
      return groupedByMilestone;
    }, {});

    let sections = Object.keys(sectionsMap).map(section => sectionsMap[section]);
    let sortedSections = sections.sort((a,b) => {
      if (a.milestone.title == b.milestone.title) {
        return 0;
      }
      let dateCompare = a.milestone.dueDate - b.milestone.dueDate;
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return a.milestone.title.localeCompare(b.milestone.title);
    });

    return (
      <View style={styles.issuesByAssignee}>
        <TouchableWithoutFeedback 
          accessibilityRole='header'
          aria-level="2" 
          onPress={() => {this.setState({collapsed: !this.state.collapsed})}}>
          <View style={styles.assignee}>
            <TouchableWithoutFeedback
              onPress={() => {
                let date = new Date();
                let to = this.props.assignee;
                let subject = `Your Assigned Issues ${date.getMonth()+1}-${date.getDate()}-${date.getFullYear().toString().slice(-2)}`;
                let body = "Here are your currently assigned issues.";
                Linking.openURL(`mailto:${to}?subject=${subject}&body=${body}`);
              }}>
              <Text style={styles.assigneeIcon}>&#xE715;</Text>
            </TouchableWithoutFeedback>
            <Text
              style={styles.assigneeName}>
              {this.props.assignee}
            </Text>
            <Text
              style={styles.assigneeCount}>
              ({this.props.list.length})
            </Text>
            {this.state.collapsed
            ? <Text style={styles.expandCollapseIcon}>&#xE70E;</Text>
            : <Text style={styles.expandCollapseIcon}>&#xE70D;</Text>
            }
          </View>
        </TouchableWithoutFeedback>
        {!this.state.collapsed && 
        <SectionList
          sections={sortedSections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({section}) =>
            <Text
              accessibilityRole='header'
              aria-level="3" 
              style={styles.milestoneSectionHeader}>{section.milestone.title}
            </Text>}
          renderItem={({item}) =>
            <Issue item={item} settings={this.props.settings}/>
          }
          renderSectionFooter={() =>
            <View style={styles.milestoneSectionSeparator}/>
          }
          />
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  issuesByAssignee: {
    marginBottom: 10,
  },
  issueTitle: {
    backgroundColor: 'white',
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
  },
  issueNumberContainer: {
    backgroundColor: 'lightgrey',
    paddingLeft: 4,
    paddingRight: 4,
    justifyContent: 'center',
  },
  issueNumber: {
    fontSize: 11,
  },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeName: {
    fontSize: 24,
    fontWeight: '600',
  },
  assigneeCount: {
    fontSize: 14,
    marginLeft: 8,
  },
  milestoneSectionHeader: {
    fontWeight: '600',
    color: 'black',
    textDecorationLine: 'underline',
  },
  milestoneSectionSeparator: {
    minHeight: 10,
  },
  issue: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
    alignItems: 'center',
  },
  labelListItem: {
    marginRight: 4,
  },
  assigneeIcon: {
    fontFamily: 'Segoe MDL2 Assets',
    fontSize: 24,
    marginRight: 4,
  },
  expandCollapseIcon: {
    fontFamily: 'Segoe MDL2 Assets',
    fontSize: 10,
    marginLeft: 4,
  }
});

export { Issue, IssueList };
