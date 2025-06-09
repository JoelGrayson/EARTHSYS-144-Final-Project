const fs=require('fs');
const turf=require('@turf/turf');
const { booleanPointInPolygon, point }=require('@turf/boolean-point-in-polygon');

const fileData=JSON.parse(
    fs.readFileSync('buffered_places_of_interest.geojson', 'utf8')
);

const pois=fileData.features.map(f=>turf.multiPolygon(f)); //places of interest

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

/** @type{{ enteredAt: Date; exitedAt: Date; durationInSeconds: number; placeOfInterestId: string; placeOfInterestName: string; placeOfInterestFacilityType: string }[]} */
const output={}

points.forEach(point=>{
    for (const poi in pois) {
        if (booleanPointInPolygon(point, poi)) {
            output.push({
                
            })
        }
    }
})

