"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const turf = __importStar(require("@turf/turf"));
const boolean_point_in_polygon_1 = require("@turf/boolean-point-in-polygon");
const fileData = JSON.parse(fs_1.default.readFileSync('buffered_places_of_interest.geojson', 'utf8'));
// Places of interest
const pois = fileData.features.map((f) => {
    return {
        fid: f.properties.fid,
        name: f.properties.Name,
        facilityType: f.properties.Facility_T,
        turfPolygon: turf.multiPolygon(f.geometry.coordinates)
    };
});
const points = fs_1.default //visited points
    .readFileSync('visited_points.csv', 'utf8')
    .trim()
    .split('\n')
    .slice(1) //ignore the first header column
    .map(e => {
    const l = e.split(',');
    return {
        timestamp: new Date(l[0]),
        latitude: +l[1],
        longitude: +l[2],
        altitude: +l[3]
    };
});
// console.log(points);
// console.log(poi);
/* Pseudocode:
1. let pointsWithPoiIds = for every point, determine its poiId as either null for not in any place or the id of the place it's in
2. let changes = loop over pointsWithPoiIds and if prev and curr have different pois, add curr to the changes array. This will be a list of items whose pois go from place to null to place to null
3. let durations = loop through changes and for each item (starting with curr and next), if the item has a poi, find the duration between the point timestamps of the poi and the next one which will not have a poi.
4. Go through all the durations and purge those under 5 minutes in duration.
*/
// Part 1 of pseudocode
let turfPointForType = turf.point([0, 0]);
const pointsWithPoiIds = [];
for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const turfPoint = turf.point([point.longitude, point.latitude]);
    let thePoiItsIn = null;
    for (const poi of pois) {
        if ((0, boolean_point_in_polygon_1.booleanPointInPolygon)(turfPoint, poi.turfPolygon)) { //point is inside a poi
            thePoiItsIn = poi;
        }
    }
    pointsWithPoiIds.push({
        point,
        poi: thePoiItsIn,
        turfPoint
    });
}
// console.log(pointsWithPoiIds);
// console.log(points, output);
// console.log(points.length);
// console.log(output.length);
// console.log(pois)
// Part 2 of pseudocode
const changes = [];
for (let i = 0; i < pointsWithPoiIds.length - 1; i++) {
    const curr = pointsWithPoiIds[i];
    const next = pointsWithPoiIds[i + 1];
    if (((_a = curr.poi) === null || _a === void 0 ? void 0 : _a.fid) !== ((_b = next.poi) === null || _b === void 0 ? void 0 : _b.fid)) {
        changes.push(curr);
    }
}
const durations = [];
for (let i = 0; i < changes.length - 1; i++) {
    const curr = changes[i];
    const next = changes[i + 1];
    const enteredAt = curr.point.timestamp;
    const exitedAt = next.point.timestamp;
    const durationInSeconds = secondsBetween(enteredAt, exitedAt);
    durations.push({
        enteredAt,
        exitedAt,
        durationInSeconds,
        poi: curr.poi
    });
}
// console.log('durations', durations);
function secondsBetween(start, end) {
    return (end.getTime() - start.getTime()) / 1000;
}
// Part 4 of pseudocode
const durationsOverFiveMinutes = [];
for (const duration of durations) {
    if (duration.durationInSeconds !== undefined && duration.durationInSeconds > 5 * 60) {
        durationsOverFiveMinutes.push(duration);
    }
}
console.log('durationsOverFiveMinutes', durationsOverFiveMinutes);
// Part 5 of pseudocode
// const dedupedDurations=[] as DurationT[];
// for (let i=0; i<durationsOverFiveMinutes.length-1; i++) {
//     const curr=durationsOverFiveMinutes[i];
//     const next=durationsOverFiveMinutes[i+1];
//     if (curr.poi?.fid===next.poi?.fid)
//         dedupedDurations.push({
//             enteredAt: curr.enteredAt,
//             exitedAt: next.exitedAt,
//             poi: curr.poi,
//             durationInSeconds: secondsBetween(curr.enteredAt, next.enteredAt)
//         });
// }
// Part 6 of pseudocode
// const finalDurations=dedupedDurations.filter(d=>d.poi!==null);
const finalDurations = durationsOverFiveMinutes.filter(d => d.poi !== null);
console.log(finalDurations);
// let currDurationStartDate=null;
// for (let i=1; i<pointsWithPoiIds.length; i++) {
//     const prev=pointsWithPoiIds[i-1];
//     const curr=pointsWithPoiIds[i];
//     if (curr.poi!==prev.poi) {
//         if (curr.poi!==prev.poi) { //entering a place
//             currDurationStartDate=curr.point.timestamp;
//         } else { //leaving a place
//             const enteredAt=currDurationStartDate ?? curr.point.timestamp;
//             const exitedAt=curr.point.timestamp;
//             durations.push({
//                 enteredAt,
//                 exitedAt,
//                 durationInSeconds: (exitedAt.getTime()-enteredAt.getTime())/1000,
//                 poi: prev.poi
//             });
//         }
//     }
//     pointWithPoid.point.timestamp
// }
