import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import AppNavigator from './src/navigation/AppNavigator';

// Register the main component of the app.
registerRootComponent(AppNavigator);
