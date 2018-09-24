import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { Observable, BehaviorSubject, pipe } from "rxjs";
import { switchMap, debounceTime, distinctUntilChanged } from "rxjs/operators";

import * as geofirex from "geofirex";
import * as firebaseApp from "firebase/app";

import { AgmMap } from '@agm/core';

@Component({
  selector: "app-map",
  templateUrl: "./map.page.html",
  styleUrls: ["./map.page.scss"]
})
export class MapPage implements OnInit, AfterViewInit {
  geo = geofirex.init(firebaseApp);
  points: Observable<any>;
  centerPoint = { latitude: -0.19, longitude: -78.49 };
  centerPointSubject = new BehaviorSubject<any>(this.centerPoint);
  radius = 1.5;
  radiusSubject = new BehaviorSubject<number>(this.radius);
  counter = 0;
  filter = false;
  field = "position";
  zoom = 8;
  collection: any;
  maxRadius = 15;
  maxRequest = 30;

  @ViewChild(AgmMap) agmMap;

  constructor() {}

  ngOnInit() {

    this.collection = this.geo.collection("places");
    this.findData();
  }

  ngAfterViewInit() {
    this.agmMap.centerChange.pipe(debounceTime(1000)).subscribe($event => {
      if (!this.filter) {
        this.centerPoint = { latitude: $event.lat, longitude: $event.lng };
        this.centerPointSubject.next(this.centerPoint);
      } else {
        this.filter = false;
      }
    });

  }

  findData(tipe?) {
    this.points = this.centerPointSubject.pipe(
      debounceTime(1000),
      // distinctUntilChanged(),
      switchMap(centerPoint => {
        console.log("filtro por las ubicacion");
        this.counter =  this.counter + 1;
        if (this.counter <= this.maxRequest) {
          return this.geo
            .collection("places")
            .within(
              this.geo.point(
                this.centerPoint.latitude,
                this.centerPoint.longitude
              ),
              this.radius,
              this.field
            );
        } else {
          if(this.counter > this.maxRequest + 3){
            /**
             * FIXME:lanzar advertencia de exceso de uso
             */
            console.log("te restan 2 oportunidades")
            this.centerPoint = centerPoint;
            return this.geo
              .collection("places")
              .within(
                this.geo.point(
                  this.centerPoint.latitude,
                  this.centerPoint.longitude
                ),
                this.radius,
                this.field
              );
          }else{
                     /**
             * FIXME: Bloquear
             */
          this.filter = true;
          if(this.counter>this.maxRequest + 5){
            console.log("Te voy a bloquear")
          }
          }
        }
      })
    );
  }
  createPoint(lat, lng) {
    let no = Math.floor(Math.random() * 100) + 101;

    this.collection.setPoint("Auto" + no, "position", lat, lng);

    // const point = this.geo.point(lat, lng);
    // collection.setDoc("my-place1", { position: point.data });
  }

  show(point) {
    console.log(point);
  }

  updateRadio(r) {
    this.radiusSubject.next(r);
  }

  centerPointDragEnd($event) {
    this.filter = true;
    this.centerPoint = {
      latitude: $event.coords.lat,
      longitude: $event.coords.lng
    };
    this.centerPointSubject.next(this.centerPoint);
  }

  mapClick(evento) {
    console.log(evento);
  }

  clickedCentro(centro) {
    console.log(centro);
  }

  mostrarMarker(m, $event) {
    console.log(m);
  }

  mapClicked($event) {
    this.createPoint($event.coords.lat, $event.coords.lng);
    // console.log($event.coords.lat, $event.coords.lng);
  }

  updateRadius(radius) {
    if (radius <= this.maxRadius) {
      this.radius = radius;
      this.radiusSubject.next(this.radius);
    }
  }
  updateCenter($event) {
    console.log($event);
    this.centerPointSubject.next({
      latitude: $event.coords.lat,
      longitude: $event.coords.lng
    });
  }
}
