import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';

const Assignee = (props) => {
  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      onPress={() => {
        props.onPress(props.assignee);
      }}>
      <View style={props.isRequired ? styles.required : styles.assignee}>
        <Text style={styles.assigneeText}>{props.assignee}</Text>
      </View>
    </TouchableWithoutFeedback>
  )
}

const AssigneeList = (props) => {
  return (
    <View style={styles.list}>
      {props.assignees.map(assignee => {
        let isRequired = props.required === undefined
          ? true
          : props.required === assignee;
        return (
          <View
            key={assignee}
            style={styles.listItem}>
            <Assignee
              assignee={assignee}
              isRequired={isRequired}
              onPress={(assignee) => {
                props.addToFilter(assignee)
              }}/>
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
    borderColor: 'black',
    borderWidth: 2,
    paddingLeft: 4,
    paddingRight: 4,
  },
  assignee: {
    borderColor: '#CCCCCC',
    borderWidth: 2,
    paddingLeft: 4,
    paddingRight: 4,
  },
  assigneeText: {
    color: 'black',
  }
});

export { AssigneeList };
