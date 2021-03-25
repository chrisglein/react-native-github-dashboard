import React, {useState, Fragment} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';

import { GitHubQuery } from './Query'

const useInitialURL = () => {
  const [url, setUrl] = useState(null);
  const [processing, setProcessing] = useState(true);

  const getUrlAsync = async () => {
    // Get the deep link used to open the app
    const initialUrl = await Linking.getInitialURL();

    setUrl(initialUrl);
    setProcessing(false);
  };

  getUrlAsync();

  return { url, processing };
};

const getQueryParam = (url, param) => {
  var regex = new RegExp("[?&]" + param + "=([^&]+).*$");
  var match = url.match(regex);
  return match === null ? undefined : decodeURIComponent(match[1].replace(/\+/g, " "));
}

const getQueryParams = (url) => {
  console.log(`Launched with url '${url}'`)
  let params = {
    assignee: getQueryParam(url, "assignee"),
    milestone: getQueryParam(url, "milestone"),
    issueType: getQueryParam(url, "issueType"),
  }
  console.log(params);
  return params;
}

const App = () => {
  const { url: initialUrl, processing } = useInitialURL();

  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
            {
              (processing)
                ? <ActivityIndicator/>
                : <GitHubQuery queryParams={getQueryParams(initialUrl)}/>
            }
        </ScrollView>
      </SafeAreaView>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: 'white',
  },
});

export default App;
