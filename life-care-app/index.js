import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

// Register the main component of the app using AppRegistry.
AppRegistry.registerComponent('main', () => AppNavigator);
