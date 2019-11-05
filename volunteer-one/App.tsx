import ExpoConstants from "expo-constants";
import moment from "moment";
import React from 'react';
import { Platform, StatusBar, SafeAreaView, StyleSheet, AsyncStorage, Picker, DatePickerAndroid, DatePickerIOS, Text } from 'react-native';
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
  date: Date,
  email: string,
  hours: number,
  isAddingActivity: boolean,
  isLoadingComplete: boolean,
  isSigningIn: boolean,
  organization: string,
  password: string,
}

interface Props {
  skipLoadingScreen: boolean,
}

export default class App extends React.Component<Props, State> {
  state = {
    date: new Date(),
    email: '',
    hours: 1,
    isAddingActivity: false,
    isLoadingComplete: false,
    isSigningIn: false,
    organization: '',
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
          "OrganizationId": this.state.organization,
          "DatePerformed": this.state.date.toISOString().substr(0, 10),
          "Notes": "TEST",
          "Hours": this.state.hours.toFixed(1),
          "ActivityStatus": 2, //2-confirmed
          "IsSkillsBased": false,
          "IsDuringWorkHours": false
        }),
      });
    if (res && res.ok) {
      console.log(res);
      AsyncStorage.setItem('cookie', JSON.stringify(res.headers.get("set-cookie")))
      this.setState({ isAddingActivity: false });
    } else {
      console.log("error loggin in");
      console.log(res);
      throw Error((res || {}).statusText);
    }
  }

  private getDateAndroid = async () => {
    try {
      const result = await DatePickerAndroid.open({
        date: this.state.date,
        mode: "default",
      });
      if (result.action !== DatePickerAndroid.dismissedAction) {
        this.setState({ date: moment([result.year, result.month, result.day]).toDate() });
      }
    } catch ({ code, message }) {
      console.warn("Cannot open date picker", message);
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
            <Text>Date:</Text>
            {
              Platform.select({
                // soon less shenanigans w/ https://github.com/react-native-community/react-native-datetimepicker
                android:
                  <Button
                    style={{ margin: 10 }}
                    mode="outlined" icon="calendar"
                    onPress={() => this.getDateAndroid()}>
                    {moment(this.state.date).format("l")}
                  </Button>
                ,
                ios:
                  <DatePickerIOS
                    style={{ margin: 10 }}
                    mode="date"
                    date={this.state.date}
                    onDateChange={(date) => this.setState({ date })} />
                ,
              })
            }

            <Text>Hours:</Text>
            <Picker
              style={{ width: "80%", alignSelf: "center", maxHeight: 180, justifyContent: "center" }}
              selectedValue={this.state.hours}
              onValueChange={hours => this.setState({ hours })}>
              {Array.from({ length: 20 }).map((_value, i) =>
                <Picker.Item key={i / 2.0} label={(i / 2.0).toString()} value={i / 2.0} />
              )}
            </Picker>

            <Text>Organization:</Text>
            <Picker
              style={{ width: "80%", alignSelf: "center", maxHeight: 180, justifyContent: "center" }}
              selectedValue={this.state.organization}
              onValueChange={organization => this.setState({ organization })}>
              <Picker.Item key="2005" label="TeamMates Mentoring Program - Lincoln" value="2005" />
              <Picker.Item key="2085" label="Lincoln Parks & Recreation" value="2085" />
              <Picker.Item key="2001" label="Boys and Girls Club of Lincoln/Lancaster County" value="2001" />
              <Picker.Item key="2002" label="Cornhusker Place of Lincoln/Lancaster County" value="2002" />
              <Picker.Item key="2003" label="Cat House" value="2003" />
              <Picker.Item key="2004" label="People's City Mission" value="2004" />
              <Picker.Item key="2006" label="TeamMates Mentoring Program" value="2006" />
              <Picker.Item key="2007" label="Food Bank of Lincoln" value="2007" />
              <Picker.Item key="2008" label="YMCA of Lincoln" value="2008" />
              <Picker.Item key="2009" label="Family Service Association" value="2009" />
              <Picker.Item key="2010" label="Lincoln Children's Zoo" value="2010" />
              <Picker.Item key="2011" label="Nebraska Community Blood Bank" value="2011" />
              <Picker.Item key="2012" label="Volunteer Partners" value="2012" />
              <Picker.Item key="2013" label="Child Advocacy Center" value="2013" />
              <Picker.Item key="2014" label="Lincoln Children's Museum" value="2014" />
              <Picker.Item key="2015" label="Nebraska 4-H Foundation" value="2015" />
              <Picker.Item key="2016" label="Runza" value="2016" />
              <Picker.Item key="2017" label="Other Organization" value="2017" />
              <Picker.Item key="2018" label="Trenton Area Soup Kitchen" value="2018" />
              <Picker.Item key="2019" label="Kitten House" value="2019" />
              <Picker.Item key="2022" label="Austen McDougal" value="2022" />
              <Picker.Item key="2023" label="Team Jack" value="2023" />
              <Picker.Item key="2024" label="Foodnet, Inc." value="2024" />
              <Picker.Item key="2025" label="Lincoln/Lancaster County Habitat for Humanity" value="2025" />
              <Picker.Item key="2026" label="United Way of Lincoln and Lancaster County" value="2026" />
              <Picker.Item key="2027" label="Salvation Army" value="2027" />
              <Picker.Item key="2028" label="Matt Talbot Kitchen & Outreach" value="2028" />
              <Picker.Item key="2029" label="Lincoln Literacy" value="2029" />
              <Picker.Item key="2030" label="Foundation for Lincoln City Libraries" value="2030" />
              <Picker.Item key="2031" label="Tabitha Inc." value="2031" />
              <Picker.Item key="2032" label="Girl Scouts-Spirit of Nebraska" value="2032" />
              <Picker.Item key="2033" label="Heartland Big Brothers Big Sisters" value="2033" />
              <Picker.Item key="2034" label="Boy Scouts of America-Cornhusker Council" value="2034" />
              <Picker.Item key="2035" label="Junior Achievement of Lincoln, Inc." value="2035" />
              <Picker.Item key="2036" label="Center For People In Need Inc" value="2036" />
              <Picker.Item key="2037" label="Clinic With A Heart Inc" value="2037" />
              <Picker.Item key="2038" label="JDRF-Lincoln Chapter" value="2038" />
              <Picker.Item key="2039" label="Knights of Columbus" value="2039" />
              <Picker.Item key="2040" label="Lincoln Public Schools" value="2040" />
              <Picker.Item key="2041" label="Lighthouse" value="2041" />
              <Picker.Item key="2042" label="Healthy Lincoln" value="2042" />
              <Picker.Item key="2043" label="Lincoln YWCA" value="2043" />
              <Picker.Item key="2044" label="St Monica's Home" value="2044" />
              <Picker.Item key="2045" label="Cedars Youth Services Inc" value="2045" />
              <Picker.Item key="2046" label="Friendship Home Of Lincoln" value="2046" />
              <Picker.Item key="2047" label="Lux Center For The Arts" value="2047" />
              <Picker.Item key="2048" label="El Centro de las Americas" value="2048" />
              <Picker.Item key="2049" label="Leadership Lincoln" value="2049" />
              <Picker.Item key="2050" label="Voices of Hope" value="2050" />
              <Picker.Item key="2051" label="MilkWorks" value="2051" />
              <Picker.Item key="2052" label="Northeast Family Center" value="2052" />
              <Picker.Item key="2053" label="Aiding Angels" value="2053" />
              <Picker.Item key="2054" label="Climate Reality Project" value="2054" />
              <Picker.Item key="2055" label="Association for Computing Machinery - UNL" value="2055" />
              <Picker.Item key="2056" label="City Impact" value="2056" />
              <Picker.Item key="2057" label="Child Guidance Center" value="2057" />
              <Picker.Item key="2058" label="Malone Community Center" value="2058" />
              <Picker.Item key="2059" label="Lincoln South Rotary" value="2059" />
              <Picker.Item key="2060" label="Good Neighbor Community Center" value="2060" />
              <Picker.Item key="2063" label="TeamMates Mentoring - Lincoln" value="2063" />
              <Picker.Item key="2065" label="VolunteerOne" value="2065" />
              <Picker.Item key="2068" label="Kids Who Code - Huntington" value="2068" />
              <Picker.Item key="2071" label="University of Nebraska" value="2071" />
              <Picker.Item key="2072" label="Jacht" value="2072" />
              <Picker.Item key="2074" label="Prairie Hill Learning Center" value="2074" />
              <Picker.Item key="2075" label="Special Olympics Nebraska" value="2075" />
              <Picker.Item key="2076" label="Academy of Rock" value="2076" />
              <Picker.Item key="2077" label="Community Action Partnership of Lancaster & Saunders Counties" value="2077" />
              <Picker.Item key="2078" label="Community Crops" value="2078" />
              <Picker.Item key="2079" label="Destination Imagination" value="2079" />
              <Picker.Item key="2080" label="Keep Nebraska Beautiful" value="2080" />
              <Picker.Item key="2081" label="Keep Lincoln & Lancaster County Beautiful" value="2081" />
              <Picker.Item key="2082" label="Lincoln Animal Ambassadors" value="2082" />
              <Picker.Item key="2083" label="Lincoln Community Foundation" value="2083" />
              <Picker.Item key="2084" label="Lincoln Fencing Association" value="2084" />
              <Picker.Item key="2086" label="College View Academy" value="2086" />
              <Picker.Item key="2087" label="Lincoln Rebels Baseball" value="2087" />
              <Picker.Item key="2088" label="Lincoln Symphony Orchestra" value="2088" />
              <Picker.Item key="2089" label="Lincoln Youth Sports Association" value="2089" />
              <Picker.Item key="2090" label="Nebraska GIS/LIS Association" value="2090" />
              <Picker.Item key="2091" label="Near South Neighborhood Association" value="2091" />
              <Picker.Item key="2092" label="FIRST LEGO League Robotics" value="2092" />
              <Picker.Item key="2093" label="FIRST Tech Challenge Robotics" value="2093" />
              <Picker.Item key="2094" label="Nebraska Golf Association" value="2094" />
              <Picker.Item key="2095" label="Nebraska Wesleyan University" value="2095" />
              <Picker.Item key="2096" label="NeighborWorks" value="2096" />
              <Picker.Item key="2097" label="NET Foundation for Television" value="2097" />
              <Picker.Item key="2098" label="North American Sarracenia Conservancy" value="2098" />
              <Picker.Item key="2099" label="Nebraska State Soccer Association" value="2099" />
              <Picker.Item key="2100" label="Pius X High School" value="2100" />
              <Picker.Item key="2101" label="Prairie Astronomy Club" value="2101" />
              <Picker.Item key="2102" label="American Red Cross National Association" value="2102" />
              <Picker.Item key="2103" label="American Red Cross - Cornhusker Chapter" value="2103" />
              <Picker.Item key="2104" label="Ronald McDonald House Charities in Omaha" value="2104" />
              <Picker.Item key="2105" label="New Covenant Community Church" value="2105" />
              <Picker.Item key="2106" label="Royal Family Kids Camp Lincoln" value="2106" />
              <Picker.Item key="2107" label="Lincoln Christian School" value="2107" />
              <Picker.Item key="2108" label="Youth Actors Academy of Lincoln" value="2108" />
              <Picker.Item key="2109" label="YWCA of Lincoln" value="2109" />
              <Picker.Item key="2110" label="Groundwater Foundation" value="2110" />
              <Picker.Item key="2111" label="International Carnivorous Plant Society" value="2111" />
              <Picker.Item key="2112" label="Fresh Start" value="2112" />
              <Picker.Item key="2113" label="Snow Angels-City of Lincoln" value="2113" />
              <Picker.Item key="2114" label="Southeast Community College" value="2114" />
              <Picker.Item key="2115" label="St. Elizabeth Health Services" value="2115" />
              <Picker.Item key="2116" label="Siena Francis House" value="2116" />
              <Picker.Item key="2117" label="Christian Heritage Childrens Home" value="2117" />
              <Picker.Item key="2118" label="Bright Lights" value="2118" />
              <Picker.Item key="2119" label="TeamMates Mentoring - Crete" value="2119" />
              <Picker.Item key="2120" label="Crete Public Schools" value="2120" />
              <Picker.Item key="2121" label="Mary Our Queen Church of Omaha" value="2121" />
              <Picker.Item key="2122" label="Tedx Lincoln" value="2122" />
              <Picker.Item key="2124" label="Lincoln Housing Authority" value="2124" />
              <Picker.Item key="2131" label="American Cancer Society" value="2131" />
              <Picker.Item key="2132" label="PanCan" value="2132" />
              <Picker.Item key="2138" label="Kids Who Code - Huntington Travefy" value="2138" />
              <Picker.Item key="2141" label="Capital Humane Society" value="2141" />
              <Picker.Item key="2142" label="YMCA of Greater Omaha" value="2142" />
              <Picker.Item key="2143" label="Kauffman Foundation" value="2143" />
              <Picker.Item key="2144" label="One Million Cups" value="2144" />
              <Picker.Item key="2153" label="Launch Leadership" value="2153" />
              <Picker.Item key="2159" label="Nonprofit Hub" value="2159" />
              <Picker.Item key="2164" label="First Free Church" value="2164" />
              <Picker.Item key="2184" label="Lincoln Berean Church" value="2184" />
              <Picker.Item key="2209" label="University of Nebraska Extension-Lancaster County 4-H" value="2209" />
              <Picker.Item key="2242" label="Madonna Rehabilitation Hospital" value="2242" />
              <Picker.Item key="2415" label="BikeLNK" value="2415" />
              <Picker.Item key="2450" label="Lincoln Center Kiwanis" value="2450" />
            </Picker>
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
    flex: 1,
    paddingTop: Platform.OS === "android" && ExpoConstants.statusBarHeight > 24 ? 10 : 0,
  },
  textInput: {
    margin: 10,
  },
});
