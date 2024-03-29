import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';

const Milestone = (props) => {
  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      onPress={() => {
        props.onPress(props.milestone);
      }}>
      <View style={props.isRequired ? styles.required : styles.milestone}>
        <Text style={styles.milestoneText}>{props.milestone.title}</Text>
      </View>
    </TouchableWithoutFeedback>
  )
}

const MilestoneList = (props) => {
  let milestones = Object.values(props.milestonesById).sort((a,b) => (a.dueDate - b.dueDate));
  return (
    <View style={styles.list}>
      {milestones.map(milestone => {
        let isRequired = props.required === undefined
          ? true
          : props.required === milestone.title;
        return (
          <View
            key={milestone.title}
            style={styles.listItem}>
            <Milestone
              milestone={milestone}
              isRequired={isRequired}
              onPress={(milestone) => {
                props.addToFilter(milestone)
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
    backgroundColor: 'black',
    paddingLeft: 4,
    paddingRight: 4,
  },
  milestone: {
    backgroundColor: 'gray',
    paddingLeft: 4,
    paddingRight: 4,
  },
  milestoneText: {
    color: 'white',
  }
});

export { MilestoneList };
