import 'package:firebase_core/firebase_core.dart';

class AppFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return web;
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAv3SA4IV55tCtILLzC-p3xPH-ALRPnfGg',
    appId: '1:1071903625466:web:a99aff1fd5ccfa870bf943',
    messagingSenderId: '1071903625466',
    projectId: 'agri-logix',
    authDomain: 'agri-logix.firebaseapp.com',
    storageBucket: 'agri-logix.firebasestorage.app',
  );
}
