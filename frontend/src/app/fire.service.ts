import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/storage'

import * as config from '../../firebaseconfig.js'

import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class FireService {

  firebaseApplication;
  firestore: firebase.firestore.Firestore;
  auth: firebase.auth.Auth;
  storage: firebase.storage.Storage;
  currentlySignedInUserAvatarURL: string = "https://wbi.net.au/wp-content/uploads/2019/04/person-icon-silhouette-png-12-1-e1555982192147.png";
  baseUrl: string = "http://127.0.0.1:5001/fstack23/us-central1/api/";
  messages: any[] = [];

  constructor() {
    this.firebaseApplication = firebase.initializeApp(config.firebaseconfig);
    this.firestore = firebase.firestore();
    this.auth = firebase.auth();
    this.storage = firebase.storage();

    this.auth.useEmulator('http://localhost:9099');
    this.firestore.useEmulator('localhost', 8080);
    this.storage.useEmulator('localhost', 9199);

    this.auth.onAuthStateChanged((user) => {
      if(user) {
        this.getMessages();
        this.getImageOfSignedInUser();
        this.intercept();
      }
    })


  }

  intercept() {
    axios.interceptors
      .request
      .use(async (request) => {
        request.headers.Authorization = await this.auth.currentUser?.getIdToken() + ""
        return request;
      });
  }

  async getImageOfSignedInUser() {
    this.currentlySignedInUserAvatarURL = await this.storage
      .ref('avatars')
      .child(this.auth.currentUser?.uid+"")
      .getDownloadURL();
  }

  async updateUserImage($event) {
    const img = $event.target.files[0];
    const uploadTask = await this.storage
      .ref('avatars')
      .child(this.auth.currentUser?.uid+"")
      .put(img);
    this.currentlySignedInUserAvatarURL = await uploadTask.ref.getDownloadURL();
  }

  sendMessage(sendThisMessage: any) {
    let messageDTO: MessageDTO = {
      messageContent: sendThisMessage,
      user: this.auth.currentUser?.uid+""
    }
    axios.post(this.baseUrl+'message', messageDTO).then(success => {
      console.log(success.data);
    }).catch(err => {
      console.log(err);
    })

  }

   getMessages() {
   this.firestore
      .collection('chat')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if(change.type=="added") {
            this.messages.push({id: change.doc.id, data: change.doc.data()});
          } if (change.type=='modified') {
            const index = this.messages.findIndex(document => document.id != change.doc.id);
            this.messages[index] =
            {id: change.doc.id, data: change.doc.data()}

          } if(change.type=="removed") {
            this.messages = this.messages.filter(m => m.id != change.doc.id);
          }
        })
      })
  }

    register(email: string, password: string) {
      this.auth.createUserWithEmailAndPassword(email, password);
    }

    signIn(email: string, password: string) {
      this.auth.signInWithEmailAndPassword(email, password);
    }

    signOut() {
    this.auth.signOut();
    }


}

export interface MessageDTO {
  messageContent: string;
  timestamp?: Date;
  user: string;
}
