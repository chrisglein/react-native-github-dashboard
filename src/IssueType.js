import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';

const IssueType = (props) => {
  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      onPress={() => {
        props.onPress(props.issueType);
      }}>
      <View style={props.isAllowedIssueType ? styles.requiredIssueType : styles.issueType}>
        <Text style={styles.issueTypeText}>{props.issueType}</Text>
      </View>
    </TouchableWithoutFeedback>
  )
}

const IssueTypeList = (props) => {
  return (
    <View style={styles.issueTypeList}>
      {props.issueTypes.map(issueType => {
        return (
          <View
            key={issueType}
            style={styles.issueTypeListItem}>
            <IssueType
              isAllowedIssueType={props.allowedIssueType === issueType}
              issueType={issueType}
              onPress={(issueType) => props.addToFilter(issueType)}
              />
          </View>
        )}
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  issueTypeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  issueTypeListItem: {
    marginRight: 4,
    marginBottom: 4,
  },
  requiredIssueType: {
    backgroundColor: 'black',
    paddingLeft: 4,
    paddingRight: 4,
  },
  issueType: {
    backgroundColor: 'gray',
    paddingLeft: 4,
    paddingRight: 4,
  },
  issueTypeText: {
    color: 'white',
  }
});

export { IssueTypeList };
