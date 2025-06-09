import fs from 'fs'
import * as turf from '@turf/turf'
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon'
import path from 'path';

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
1. let pointsWithPois = for every point, determine its poi as either null for not in any place or the poi itself
2. let changes = loop over pointsWithPois and if prev and curr have different pois, add curr to the changes array. This will be a list of items whose pois go from place to null to place to null
3. let durations = loop through changes and for each item (starting with curr and next), find the duration between the point timestamps of the poi and the next one.
4. Loop through all durations. If a duration is under 5 minutes. Delete it.
5. Go through all the items now and remove those adjacent who have the same poi (this is to remove instances where you stepped outside of the building and entered again in 5 minutes).
6. Remove those whose pois are null
*/

// Part 1 of pseudocode
let turfPointForType=turf.point([0, 0]);
type PoiT=typeof pois[number];
type PointT=typeof points[number];
type TurfPointT=typeof turfPointForType;
type PointWithPoiIdT={ poi: PoiT | null; point: PointT, turfPoint: TurfPointT };
const pointsWithPoiIds=[] as PointWithPoiIdT[];

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

// console.log(pointsWithPoiIds);

// console.log(points, output);
// console.log(points.length);
// console.log(output.length);
// console.log(pois)


// Part 2 of pseudocode
const changes=[] as PointWithPoiIdT[];

for (let i=0; i<pointsWithPoiIds.length-1; i++) {
    const curr=pointsWithPoiIds[i];
    const next=pointsWithPoiIds[i+1];
    if (curr.poi?.fid !== next.poi?.fid) {
        changes.push(curr);
    }
}

// console.log('changes', changes);


// Part 3 of pseudocode
type DurationT={ enteredAt: Date; exitedAt?: Date; durationInSeconds?: number; poi: PoiT | null };
const durations=[] as DurationT[];

for (let i=0; i<changes.length-1; i++) {
    const curr=changes[i];
    const next=changes[i+1];

    const enteredAt=curr.point.timestamp;
    const exitedAt=next.point.timestamp;
    const durationInSeconds=secondsBetween(enteredAt, exitedAt);
    durations.push({
        enteredAt,
        exitedAt,
        durationInSeconds,
        poi: curr.poi
    });
}

// console.log('durations', durations);

function secondsBetween(start: Date, end: Date) {
    return (end.getTime()-start.getTime())/1000;
}


// Part 4 of pseudocode
const durationsOverFiveMinutes=[] as DurationT[];

for (const duration of durations) {
    if (duration.durationInSeconds!==undefined && duration.durationInSeconds>5*60) {
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
const finalDurations=durationsOverFiveMinutes.filter(d=>d.poi!==null);


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




function exportItems(name: string, durations: DurationT[]) {
    const outputString=
        'Duration in Seconds,Entered At,Exited At,Place of Interest Name,Place of Interest Facility Type,Places of Interest Id\n'
        +durations
            .map(e=>`${e.durationInSeconds},${e.enteredAt.toISOString()},${e.exitedAt?.toISOString()},${e.poi?.name},${e.poi?.facilityType},${e.poi?.fid}`)
            .join('\n');

    fs.writeFileSync(path.join(__dirname, 'output', name), outputString);
}


exportItems('all.csv', finalDurations);
exportItems('dining_halls.csv', finalDurations.filter(e=>e.poi?.facilityType==='dining'));
exportItems('dorms.csv', finalDurations.filter(e=>e.poi?.facilityType==='dorm'));
exportItems('gym.csv', finalDurations.filter(e=>e.poi?.facilityType==='gym'));

