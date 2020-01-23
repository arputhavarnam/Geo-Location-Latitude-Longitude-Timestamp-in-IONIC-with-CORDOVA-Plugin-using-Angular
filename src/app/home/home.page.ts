import { Component, ViewChild, ElementRef } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { map, takeWhile, tap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, from, timer } from 'rxjs';
import 'rxjs/add/observable/interval'
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { NavController } from '@ionic/angular';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/toPromise';

declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {
  user = null;
  locations: Observable<any>;
  locationsCollection: AngularFirestoreCollection<any[]>;
  database: any;

  TimeOutIn: number;
  curlat: any;
  curlng: any;
  tmstp: any;

  @ViewChild('map', { static: true }) mapElement: ElementRef;
  map: any;
  currentMapTrack = null;
  latlong: any;

  isTracking = false;
  [x: string]: any;

  maxtime: any = 30

  constructor(private geolocation: Geolocation, private afAuth: AngularFireAuth, private afs: AngularFirestore, public navCtrl: NavController) {
    this.loadDBfire();
  }

watch(){
  let watch = this.geolocation.watchPosition();
watch.subscribe((data) => {
  this.curlat = data.coords.latitude,
  this.curlng = data.coords.longitude,
  this.tmstp = data.timestamp
});
}

Ionviewdidenter(){
  this.watch();
}

  about() {
    this.navCtrl.navigateRoot('about');
  }

  loadDBfire() {
    this.locationsCollection = this.afs.collection(`mapcollection`,
      ref => ref.orderBy('timestamp', 'desc'))
    this.locations = this.locationsCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data };
      })
      ));
  }

  viewLatLong() {
    return this.locationsCollection;
  }

  startTracking() {
    this.TimeOutIn = 60;
    this.isTracking = true;
    this.trackedRoute = [];
    this.positionSubscription = this.geolocation.getCurrentPosition().then(data => {
      setTimeout(() => {
        if (data) {
          this.addNewLocation(
            this.curlat = data.coords.latitude,
            this.curlng = data.coords.longitude,
            this.tmstp = data.timestamp
          );
        }
      }, 0);
    });

    this.subscription = timer(1000, 1000)
      .pipe(takeWhile(() => this.TimeOutIn > 0), tap(() => this.TimeOutIn--))
      .subscribe(() => {
        console.log(this.TimeOutIn);
      });

    this.latlong = setInterval(function () {
      this.positionSubscription = this.geolocation.getCurrentPosition().then(data => {
        setTimeout(() => {
          if (data) {
            this.addNewLocation(
              data.coords.latitude,
              data.coords.longitude,
              data.timestamp
            );
          }
        }, 0);
      });
      this.TimeOutIn = 60;
    }.bind(this), 60000);
  }

  addNewLocation(lat, lng, timestamp) {
    return new Promise<any>((resolve, reject) => {
      this.afs.collection('/mapcollection').add({
        lat,
        lng,
        timestamp
      })
        .then(
          (res) => {
            resolve(res)
          },
          err => reject(err)
        )
    })
  }

  stopTracking() {
    clearInterval(this.latlong);
    this.TimeOutIn = 0;
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    this.currentMapTrack.setMap(null);
    this.subscription.unsubscribe();
    clearInterval(this.locgeo)
  }
}