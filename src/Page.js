import React, {Component} from 'react';
import { View } from 'react-native';

import { IssueList } from './Issue'
import { GroupedLabelFilterList } from './Label'
import { MilestoneList } from './Milestone'
import { IssueTypeList } from './IssueType'
import { CollapsableHeader } from './Collapsable'

const AssigneeList = (props) => {
  let assignees = Object.keys(props.issuesByAssignee).sort((a,b) => {
    let issuesA = props.issuesByAssignee[a];
    let issuesB = props.issuesByAssignee[b];
    return issuesB.length - issuesA.length;
  });
  return assignees.map(assignee => (
    <IssueList
      key={assignee}
      assignee={assignee}
      list={props.issuesByAssignee[assignee]}
    />
  ));
}

class Page extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requiredMilestone: undefined,
      requiredLabels: [],
      forbiddenLabels: [],
      allowedIssueType: 'issue',
    };
  }

  countById(collection, id, item) {
    let existing = collection[id];
    if (!existing) {
      existing = collection[id] = item;
      existing.count = 1;
    } else {
      existing.count += 1;
    }
  }

  addById(collection, id, item) {
    let existing = collection[id];
    if (!existing) {
      collection[id] = [item];
    } else {
      existing.push(item);
    }
  }

  render() {
    let issuesByAssignee = {};
    let milestonesById = {};
    let labelsById = {};

    this.props.issues.forEach(issue => {

      let isAllowedIssueType = (this.state.allowedIssueType === undefined || this.state.allowedIssueType === issue.issueType);

      let haveRequiredLabels = this.state.requiredLabels.length > 0;
      let requiredLabelsMatched = issue.labels.reduce((requiredLabelsMatched, current) => {
        if (this.state.requiredLabels.includes(current.id)) {
          requiredLabelsMatched++;
        }
        return requiredLabelsMatched;
      }, 0);

      let forbiddenLabelsMatched = issue.labels.reduce((forbiddenLabelsMatched, current) => {
        if (this.state.forbiddenLabels.includes(current.id)) {
          forbiddenLabelsMatched++;
        }
        return forbiddenLabelsMatched;
      }, 0);

      let milestonesMatched = this.state.requiredMilestone == issue.milestone.title;

      if ((forbiddenLabelsMatched == 0) && 
         (!haveRequiredLabels || requiredLabelsMatched) &&
         (!this.state.requiredMilestone || milestonesMatched) &&
         isAllowedIssueType) {
        this.addById(issuesByAssignee, issue.assignee, issue);
      }

      issue.labels.forEach(label => {
        this.countById(labelsById, label.id, label);
      });

      if (issue.milestone.id) {
        this.countById(milestonesById, issue.milestone.title, issue.milestone);
      }
    });

    const toggleFromList = (list, item) => {
      let index = list.indexOf(item);
      let newList;
      if (index >= 0) {
        newList = [...list];
        newList.splice(index, 1);
      } else {
        newList = [item, ...list];
      }
      return newList;
    }

    const addToLabelFilter = (label) => {
      console.log(`Require '${label.name}'`);
      this.setState({
        requiredLabels: toggleFromList(this.state.requiredLabels, label.id),
      });
    }
    const filterOutLabel = (label) => {
      console.log(`Forbid '${label.name}'`);
      this.setState({
        forbiddenLabels: toggleFromList(this.state.forbiddenLabels, label.id),
      });
    }
    const resetLabelFilters = () => {
      console.log(`Reset all filters`);
      this.setState({
        requiredLabels: [],
        forbiddenLabels: [],
      });
    }

    const addToIssueTypeFilter = (issueType) => {
      console.log(`IssueType '${issueType}'`);
      this.setState({
        allowedIssueType: (this.state.allowedIssueType === issueType) ? undefined : issueType,
      });
    }

    return (
      <>
        <CollapsableHeader header="Milestones" level={2}>
          <MilestoneList
            milestonesById={milestonesById}
            requiredMilestone={this.state.requiredMilestone}
            addToFilter={(milestone) => {
              if (this.state.requiredMilestone == milestone.title) {
                this.setState({
                  requiredMilestone: undefined,
                });
              } else {
                this.setState({
                  requiredMilestone: milestone.title,
                });
              }
          }}/>
        </CollapsableHeader>
        <CollapsableHeader header="Labels" level={2} style={{backgroundColor: '#eeeeee'}}>
          <GroupedLabelFilterList
            labelsById={labelsById}
            requiredLabels={this.state.requiredLabels}
            forbiddenLabels={this.state.forbiddenLabels}
            addToFilter={addToLabelFilter}
            filterOut={filterOutLabel}
            resetFilters={resetLabelFilters}
          />
        </CollapsableHeader>
        <CollapsableHeader header="Types" level={2}>
          <IssueTypeList
            allowedIssueType={this.state.allowedIssueType}
            issueTypes={['issue', 'pull_request'] /* TODO: Share possible values with Query.js */}
            addToFilter={addToIssueTypeFilter}
          />
        </CollapsableHeader>
        <CollapsableHeader header="Results" level={2}>
          <AssigneeList
            issuesByAssignee={issuesByAssignee}
            requiredLabels={this.state.requiredLabels}/>
        </CollapsableHeader>
      </>
    );
  }
}

export { Page };
