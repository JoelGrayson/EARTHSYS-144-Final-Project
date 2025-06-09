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
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const turf = __importStar(require("@turf/turf"));
const boolean_point_in_polygon_1 = require("@turf/boolean-point-in-polygon");
const fileData = JSON.parse(fs_1.default.readFileSync('buffered_places_of_interest.geojson', 'utf8'));
// Places of interest
const pois = fileData.features.map((f) => {
    console.log('f', f);
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
const output = [];
points.forEach(point => {
    const turfPoint = turf.point([point.longitude, point.latitude]);
    for (const poi of pois) {
        if ((0, boolean_point_in_polygon_1.booleanPointInPolygon)(turfPoint, poi.turfPolygon)) {
            output.push({
                enteredAt: point.timestamp,
                placeOfInterestId: poi.fid,
                placeOfInterestFacilityType: poi.facilityType,
                placeOfInterestName: poi.name
            });
        }
    }
});
console.log(points, output);
console.log(points.length);
console.log(output.length);
// console.log(pois)
