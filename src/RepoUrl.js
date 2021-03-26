import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
} from 'react-native';

let RepoUrl = (props) => {
  let [url, setUrl] = useState(props.url);

  return (
    <View style={{flexDirection: 'row'}}>
      <TextInput
        style={{height: 32, flexGrow: 1}}
        value={url}
        onChangeText={value => setUrl(value)}
        onSubmitEditing={event => props.onUrlChanged(event.nativeEvent.text)}/>
      <Button title='x' onPress={props.removeUrl}/>
    </View>
  );
}

let RepoUrls = (props) => {
  let [urls, setUrls] = useState(props.urls);

  const addUrl = () => {
    urls = [...urls, ''];
    setUrls(urls);
    props.onUrlsChanged(urls);
  }

  return (
    <View>
      <View style={{flexGrow: 1, marginRight: 12}}>
        <Text>Repo urls</Text>
        {urls.map((url, index) => {
          const changeUrl = (value) => {
            let newUrls = [...urls];
            newUrls[index] = value;
            props.onUrlsChanged(newUrls);
          }
          const removeUrl = () => {
            urls.splice(index, 1);
            props.onUrlsChanged(urls);
          }
          return (
            <RepoUrl
              key={index}
              url={url}
              onUrlChanged={changeUrl}
              removeUrl={removeUrl}/>
          );
        }
        )}
        <Button title='+' onPress={addUrl}/>
      </View>
      <Button title='reset cache' onPress={() => props.clearCache()}/>
      <Button title='refresh' onPress={() => props.refreshQuery()}/>
    </View>
  );
}

export { RepoUrls };
