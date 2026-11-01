import {createHandler} from './coach.mjs';
export default createHandler({report:true});
export const config={path:['/api/calibration','/.netlify/functions/calibration'],rateLimit:{windowLimit:4,windowSize:60,aggregateBy:['ip','domain']}};
