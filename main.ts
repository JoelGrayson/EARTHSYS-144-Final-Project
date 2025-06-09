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

/* Pseudocode:
let pointsWithPoiIds = for every point, determine its poiId as either null for not in any place or the id of the place it's in
Let durations = loop over pointWithPoiId with the variables curr and prev for each loop and the outer variable currDurationStartDate. If curr and prev have a different poiIds, append to durations with the start and end times and duration and prev's poi information.
Then, go through all the durations and purge those under 5 minutes in duration.
*/


const durations=[] as { enteredAt: Date; exitedAt?: Date; durationInSeconds?: number; placeOfInterestId: string; placeOfInterestName: string; placeOfInterestFacilityType: string }[];

for (let i=0; i<points.length; i++) {
    const point=points[i];
    const pPoint=points[Math.max(i-1, 0)]; //previous point
    
    const turfPoint=turf.point([point.longitude, point.latitude]);

    let thePoiItsIn: typeof pois[number];
    for (const poi of pois) {
        if (booleanPointInPolygon(turfPoint, poi.turfPolygon)) { //point is inside a poi
            thePoiItsIn=poi;
        }
    }

    let shouldAdd=false;

    const latestPoi=durations.at(-1);
    if (!latestPoi)
        shouldAdd=true;
    if (latestPoi?.placeOfInterestId!==poi.fid) { //moved to a different place
        latestPoi?.exitedAt=point.timestamp;
        
    }
    
    
    durations.push({
        enteredAt: point.timestamp,
        placeOfInterestId: poi.fid,
        placeOfInterestFacilityType: poi.facilityType,
        placeOfInterestName: poi.name
    });
}

// console.log(points, output);
// console.log(points.length);
// console.log(output.length);
// console.log(pois)

