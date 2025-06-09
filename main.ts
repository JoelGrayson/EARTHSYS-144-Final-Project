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
1. let pointsWithPoiIds = for every point, determine its poiId as either null for not in any place or the id of the place it's in
2. let durations = loop over pointWithPoiId with the variables curr and prev for each loop and the outer variable currDurationStartDate. If curr and prev have a different poiIds, append to durations with the start and end times and duration and prev's poi information.
3. Go through all the durations and purge those under 5 minutes in duration.
*/

// Part 1 of pseudocode
let turfPointForType=turf.point([0, 0]);
type PoiT=typeof pois[number];
type PointT=typeof points[number];
type TurfPointT=typeof turfPointForType;
const pointsWithPoiIds=[] as { poi: PoiT | null; point: PointT, turfPoint: TurfPointT }[];
const durations=[] as { enteredAt: Date; exitedAt?: Date; durationInSeconds?: number; poi: PoiT | null }[];

for (let i=0; i<points.length; i++) {
    const point=points[i];    
    const turfPoint=turf.point([point.longitude, point.latitude]);

    let thePoiItsIn: typeof pois[number] | null = null;
    for (const poi of pois) {
        if (booleanPointInPolygon(turfPoint, poi.turfPolygon)) { //point is inside a poi
            thePoiItsIn=poi;
        }
    }

    pointsWithPoiIds.push({
        point,
        poi: thePoiItsIn,
        turfPoint
    });
}

console.log(pointsWithPoiIds);

// console.log(points, output);
// console.log(points.length);
// console.log(output.length);
// console.log(pois)


// Part 2 of pseudocode
let currDurationStartDate=null;
for (let i=1; i<pointsWithPoiIds.length; i++) {
    const prev=pointsWithPoiIds[i-1];
    const curr=pointsWithPoiIds[i];

    if (curr.poi!==prev.poi) {
        if (curr.poi!==null) { //entering a place
            currDurationStartDate=curr.point.timestamp;
        } else { //leaving a place
            const enteredAt=currDurationStartDate ?? curr.point.timestamp;
            const exitedAt=curr.point.timestamp;

            durations.push({
                enteredAt,
                exitedAt,
                durationInSeconds: (exitedAt.getTime()-enteredAt.getTime())/1000,
                poi: prev.poi
            });
        }
    }
    pointWithPoid.point.timestamp
}

