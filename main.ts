import fs from 'fs'
import * as turf from '@turf/turf'
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon'

const fileData=JSON.parse(
    fs.readFileSync('buffered_places_of_interest.geojson', 'utf8')
);

// Places of interest
const pois: {
    fid: string;
    name: string;
    facilityType: string;
    turfPolygon: any;
}[]=fileData.features.map((f: any)=>{
    console.log('f', f);
    return {
        fid: f.properties.fid,
        name: f.properties.Name,
        facilityType: f.properties.Facility_T,
        turfPolygon: turf.multiPolygon(f.geometry.coordinates)
    };
});

const points=fs //visited points
    .readFileSync('visited_points.csv', 'utf8')
    .trim()
    .split('\n')
    .slice(1,) //ignore the first header column
    .map(e=>{
        const l=e.split(',');

        return {
            timestamp: new Date(l[0]),
            latitude: +l[1],
            longitude: +l[2],
            altitude: +l[3]
        }
    });

// console.log(points);
// console.log(poi);

const output=[] as { enteredAt: Date; exitedAt?: Date; durationInSeconds?: number; placeOfInterestId: string; placeOfInterestName: string; placeOfInterestFacilityType: string }[];

points.forEach(point=>{
    const turfPoint=turf.point([point.longitude, point.latitude]);
    for (const poi of pois) {
        if (booleanPointInPolygon(turfPoint, poi.turfPolygon)) {
            output.push({
                enteredAt: point.timestamp,
                placeOfInterestId: poi.fid,
                placeOfInterestFacilityType: poi.facilityType,
                placeOfInterestName: poi.name
            });
        }
    }
})

// console.log(points, output);
// console.log(points.length);
// console.log(output.length);
// console.log(pois)

