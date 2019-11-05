import ExpoConstants from "expo-constants";
import React from 'react';
import { Platform, StatusBar, View, SafeAreaView, StyleSheet, AsyncStorage } from 'react-native';
import { AppLoading } from 'expo';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import * as Icon from '@expo/vector-icons';
import { useScreens } from 'react-native-screens';
import { DefaultTheme, Provider as PaperProvider, TextInput, Appbar, Button, Divider } from 'react-native-paper';

useScreens();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
  }
}

interface State {
  email: string,
  isAddingActivity: boolean,
  isLoadingComplete: boolean,
  isSigningIn: boolean,
  password: string,
}

interface Props {
  skipLoadingScreen: boolean,
}

export default class App extends React.Component<Props, State> {
  state = {
    email: '',
    isAddingActivity: false,
    isLoadingComplete: false,
    isSigningIn: true,
    password: '',
  }

  _signIn = async () => {
    this.setState({ isSigningIn: true });

    var res = await fetch("https://volunteerone.org/api/account/login",
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', //https://stackoverflow.com/questions/39188376/fetch-getting-cookies-from-fetch-response
        body: JSON.stringify({
          username: this.state.email,
          password: this.state.password
        }),
      });
    if (res && res.ok && (await res.text() === "true")) {
      console.log(res);
      AsyncStorage.setItem('cookie', JSON.stringify(res.headers.get("set-cookie")))
      this.setState({ isSigningIn: false });
    } else {
      console.log("error logging in");
      throw Error((res || {}).statusText);
    }
  };

  //TODO: params
  _logActivity = async () => {
    this.setState({ isAddingActivity: true });

    var res = await fetch("https://volunteerone.org/api/activity",
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Cookie': await AsyncStorage.getItem("cookie"),
        },
        credentials: 'same-origin', //https://stackoverflow.com/questions/39188376/fetch-getting-cookies-from-fetch-response
        body: JSON.stringify({
          "ActivityId": 0,
          "CompanyId": 0,
          "VolunteerId": 0,
          "OrganizationId": 2076,
          "DatePerformed": "2019-11-04",
          "Notes": "TEST",
          "Hours": 1,
          "ActivityStatus": 2, //2-confirmed
          "IsSkillsBased": false,
          "IsDuringWorkHours": false
        }),
      });
    if (res && res.ok) {
      console.log(res);
      AsyncStorage.setItem('cookie', JSON.stringify(res.headers.get("set-cookie")))
      this.setState({ isSigningIn: false });
    } else {
      console.log("error loggin in");
      console.log(res);
      throw Error((res || {}).statusText);
    }
  }

  async componentDidMount() { }

  render() {
    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <AppLoading
          startAsync={this._loadResourcesAsync}
          onError={this._handleLoadingError}
          onFinish={this._handleFinishLoading}
        />
      );
    } else {
      return (
        <PaperProvider theme={theme}>
          {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
          {/* persistenceKey={persistenceKey}  https://github.com/react-navigation/react-navigation.github.io/pull/425/files#diff-b668b1a4201e40b1378036dc012100fe */}
          {/* <AppNavigator /> */}
          <SafeAreaView forceInset={{ top: "never", bottom: "never", horizontal: "never" }} style={styles.container}>
            <Appbar.Header>
              <Appbar.Content title="Login" />
            </Appbar.Header>
            <TextInput
              textContentType="emailAddress"
              autoCompleteType="email"
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInput}
              label="EMAIL"
              value={this.state.email}
              onChangeText={email => this.setState({ email })}
              // returnKeyType="next"
              // onSubmitEditing={() => this.passwordField.focus()}
              blurOnSubmit={false}
            />
            <TextInput
              textContentType="password"
              autoCompleteType="password"
              secureTextEntry
              mode="outlined"
              label="PASSWORD"
              style={styles.textInput}
              value={this.state.password}
              onChangeText={password => this.setState({ password })}
              returnKeyType="done"
              // ref={input => { this.passwordField = input; }}
              onSubmitEditing={this._signIn}
              blurOnSubmit={false}
            />
            <Button mode="contained" loading={this.state.isSigningIn} onPress={this._signIn} style={styles.textInput}>
              Sign in
            </Button>
            <Divider />
            <Button mode="contained" loading={this.state.isAddingActivity} onPress={this._logActivity} style={styles.textInput}>
              Log Activity
            </Button>
          </SafeAreaView>
        </PaperProvider>
      )
    }
  }

  _loadResourcesAsync = async () => {
    await Promise.all([
      Asset.loadAsync([
        require('./assets/icon.png'),
        require('./assets/splash.png'),
      ]),
      Font.loadAsync({
        ...Icon.Ionicons.font,
      }),
    ]);
  };

  _handleLoadingError = error => {
    console.error(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "blue",
    flex: 1,
    paddingTop: Platform.OS === "android" && ExpoConstants.statusBarHeight > 24 ? 10 : 0,
  },
  textInput: {
    margin: 10,
  },
});
