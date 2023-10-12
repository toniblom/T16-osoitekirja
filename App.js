import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Input } from '@rneui/themed';
import { Button } from '@rneui/themed';
import { ListItem } from '@rneui/themed';
import { Icon } from '@rneui/themed';
import MapView, { Marker } from 'react-native-maps';

const Stack = createNativeStackNavigator();
const db = SQLite.openDatabase('placedb.db');


// PLACES SCREEN
function PlacesScreen({ navigation }) {

  const [address, setAddress] = useState();
  const [places, setPlaces] = useState([]);

  // Create the database
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('create table if not exists place (id integer primary key not null unique, address text);');
    }, null, updateList);
  }, []);

  // Save item
  const saveItem = () => {
    db.transaction(tx => {
      tx.executeSql('insert into place (address) values (?);', [address]);
    }, null, updateList
    )
  }

  // Update itemlist
  const updateList = () => {
    db.transaction(tx => {
      tx.executeSql('select * from place;', [], (_, { rows }) =>
        setPlaces(rows._array)
      );
    });
  }

  // Delete item
  const deleteItem = (id) => {
    db.transaction(
      tx => {
        tx.executeSql(`delete from place where id = ?;`, [id]);
      }, null, updateList
    )
  }

  // Render list
  renderItem = ({ item }) => (
    <ListItem bottomDivider
      onPress={() => navigation.navigate('Map', { address: item.address })}
      delayLongPress={1000} onLongPress={() => deleteItem(item.id)}>

      <View style={styles.listcontainer}>
        <ListItem.Content>
          <ListItem.Title>{item.address}</ListItem.Title>
        </ListItem.Content>
        <View style={{flexDirection: 'row'}}>
          <Text style={{color: 'gray'}}>Show on map</Text>
          <Icon type='material' name='chevron-right' color='gray' />
        </View>
      </View>

    </ListItem>
  );

  return (
    <View style={styles.container}>
      <Input
        placeholder='Type in address' label='PLACEFINDER'
        onChangeText={text => setAddress(text)} />

      <View style={styles.button}>
        <Button raised color='grey' icon={{ name: 'save', color: 'white' }} onPress={saveItem} title="SAVE" />
      </View>

      <FlatList
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        data={places}
      />

    </View>
  );
}

// MAP SCREEN
function MapScreen({ route, navigation }) {
  const { address } = route.params;

  // Latitude and longitude as MapQuest provides them, with initial values
  const [latLng, setLatLng] = useState({ lat: 60.200692, lng: 24.934302 });

  // Delta values saved as constants because MapQuest doesn't provide them
  const latitudeDelta = 0.0322;
  const longitudeDelta = 0.0221;

  // State where location is saved
  const [region, setRegion] = useState({
    latitude: latLng.lat,
    longitude: latLng.lng,
    latitudeDelta: latitudeDelta,
    longitudeDelta: longitudeDelta,
  });

  // State where marker is saved
  const [marker, setMarker] = useState({
    latitude: latLng.lat,
    longitude: latLng.lng,
  });

  const search = () => {
    fetch(`https://www.mapquestapi.com/geocoding/v1/address?maxResults=1&key=6n92vHDoYKItr56PlkIm6X4tBuIgXD7S&location=${address}`)
      .then(response => response.json())
      .then(responseJson => setLatLng(responseJson.results[0].locations[0].latLng))
      .catch(error => {
        Alert.alert('Error', error.message);
      });
  }

  // Do seach when opening the view
  useEffect(() => {
    search();
  }, []);

  // When latLng changes value, update region and marker
  useEffect(() => {
    setRegion({ latitude: latLng.lat, longitude: latLng.lng, latitudeDelta: latitudeDelta, longitudeDelta: longitudeDelta });
    setMarker({ latitude: latLng.lat, longitude: latLng.lng });
  }, [latLng]);


  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
      >
        <Marker
          coordinate={marker}
          title={address}
        />
      </MapView>
    </View>
  );
}

export default function App() {

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="My Places" component={PlacesScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  listcontainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  button: {
    // Allows to change the button screen width
    marginHorizontal: 5,
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%"
  }
});