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
      <View style={props.isRequired ? styles.required : styles.issueType}>
        <Text style={styles.issueTypeText}>{props.issueType}</Text>
      </View>
    </TouchableWithoutFeedback>
  )
}

const IssueTypeList = (props) => {
  return (
    <View style={styles.list}>
      {props.issueTypes.map(issueType => {
        let isRequired = props.required === undefined
          ? true
          : props.required === issueType;
        return (
          <View
            key={issueType}
            style={styles.listItem}>
            <IssueType
              isRequired={isRequired}
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
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  listItem: {
    marginRight: 4,
    marginBottom: 4,
  },
  required: {
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
