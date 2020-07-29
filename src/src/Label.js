import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';

const getContrastYIQ = (hexcolor) => {
  hexcolor = hexcolor.replace('#', '');
  let r = parseInt(hexcolor.substr(0,2),16);
  let g = parseInt(hexcolor.substr(2,2),16);
  let b = parseInt(hexcolor.substr(4,2),16);
  let yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? 'black' : 'white';
}

class Label extends Component {
  render() {
    let foregroundColor = this.props.foregroundColor ?? getContrastYIQ(this.props.label.color);
    return (
      <TouchableWithoutFeedback
        accessibilityRole={this.props.onPress ? 'button' : 'link'}
        href={this.props.label.url}
        onPress={() => {
          if (this.props.onPress) {
            this.props.onPress(this.props.label);
          } else {
            Linking.openURL(this.props.label.url)
          }
        }}>
        <View style={{backgroundColor: '#' + this.props.label.color, ...styles.labelContainer}}>
          <Text style={{color: foregroundColor, ...styles.labelText}}>{this.props.label.name}</Text>
          {this.props.children}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const LabelFilterList = (props) => {
  let labels = Object.values(props.labelsById).sort((a,b) => (b.count - a.count));
  return (
    <View style={styles.labelList}>
      {labels.map(label => {
        let isRequired = props.requiredLabels == label.id;
        let foregroundColor = getContrastYIQ(label.color);
        return (
          <View
            key={label.id}
            style={styles.labelListItem}>
            <Label
              accessibilityRole='button'
              label={label}
              foregroundColor={foregroundColor}
              onPress={(label) => {
                props.addToFilter(label);
            }}>
              {(isRequired ?
                <Text style={{color: foregroundColor, ...styles.filterIcon}}>&#xE71C;</Text> :
                null)
              }
            </Label>
            
          </View>
      )})}
    </View>
  )
}

const styles = StyleSheet.create({
  labelList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  labelListItem: {
    marginRight: 4,
    marginBottom: 4,
    flexDirection: 'row',
  },
  labelContainer: {
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 8,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 11,
  },
  filterIcon: {
    fontFamily: 'Segoe MDL2 Assets',
    fontSize: 11,
  }
});

export { Label, LabelFilterList };
