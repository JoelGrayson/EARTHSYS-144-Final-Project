// Pseudocode: Loop through each of the points. You can only go to a place once. You can only return to that place once you have been elsewhere first.

const fs=require('fs');
const path=require('path');

const pathFile=(name)=>path.join(__dirname, name);
const outputFile=(name)=>path.join(__dirname, 'output', name);
const contents=fs.readFileSync(pathFile('visited_points_with_buffer_info.csv'), 'utf8');

// fid (string), timestamp (string for date), latitude (number), longitude (number), altitude (number), fid_2 (string, the ID of the place of interest), Name (name of the place of interest), Facility_T (type of the facility like "dining"/"dorm")
const lines=contents.trim()
    .split('\n') //split lines into entries
    .slice(1,); //ignore the first header line which is column names

// console.log(lines);
// Example:   '769,2025/05/17 00:26:29.000,37.424509212306091,-122.165744189923714,29.387856966815889,1,Stern Dining,dining',
//            '280,2025/05/13 01:49:17.000,37.424574167409283,-122.165784126133033,29.327161964960396,1,Stern Dining,dining',
const data=lines.map(line=>{
    const entries=line.split(',');

    return {
        pointId: entries[0],
        date: new Date(entries[1]),
        lat: +entries[2],
        lng: +entries[3],
        altitude: +entries[4],
        placeOfInterestId: entries[5],
        placeOfInterestName: entries[6],
        placeOfInterestFacilityType: entries[7]
    };
});
// Example:
//   {
//     pointId: '769',
//     date: 2025-05-17T04:26:29.000Z,
//     lat: 37.42450921230609,
//     lng: -122.16574418992371,
//     altitude: 29.38785696681589,
//     placeOfInterestId: '1',
//     placeOfInterestName: 'Stern Dining',
//     placeOfInterestFacilityType: 'dining'
//   },
//   {
//     pointId: '280',
//     date: 2025-05-13T05:49:17.000Z,
//     lat: 37.42457416740928,
//     lng: -122.16578412613303,
//     altitude: 29.327161964960396,
//     placeOfInterestId: '1',
//     placeOfInterestName: 'Stern Dining',
//     placeOfInterestFacilityType: 'dining'
//   },

data.sort((a, b)=>a.date.getTime()-b.date.getTime()); //sort by earliest first, which also corresponds to the IDs

let lastVisitedPlaceOfInterestId=null;
/** @type {{ placeOfInterestId: string; placeOfInterestName: string; placeOfInterestFacilityType: string; date: Date }[]} */
const visitedList=[];

data.forEach(place=>{
    if (lastVisitedPlaceOfInterestId==place.placeOfInterestId)
        return; //can't visit the same place before visiting another place first

    lastVisitedPlaceOfInterestId=place.placeOfInterestId;
    visitedList.push({
        date: place.date,
        placeOfInterestId: place.placeOfInterestId,
        placeOfInterestName: place.placeOfInterestName,
        placeOfInterestFacilityType: place.placeOfInterestFacilityType
    });
});

// console.log(visitedList);

function exportItems(name, filterCb) {
    const outputString=
        'Date,Place of Interest Name,Place of Interest Facility Type,Places of Interest Id\n'
        +visitedList
            .filter(filterCb)
            .map(e=>`${e.date.toISOString()},${e.placeOfInterestName},${e.placeOfInterestFacilityType},${e.placeOfInterestId}`)
            .join('\n');

    fs.writeFileSync(outputFile(name), outputString);
}

exportItems('all.csv', ()=>true);
exportItems('dining_halls.csv', e=>e.placeOfInterestFacilityType==='dining');
exportItems('dorms.csv', e=>e.placeOfInterestFacilityType==='dorm');
exportItems('gym.csv', e=>e.placeOfInterestFacilityType==='gym');

