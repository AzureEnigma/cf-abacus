'use strict';

// A sample container service metered by memory consumption over time

/* istanbul ignore file */

module.exports = {
  resource_id: 'linux-container',
  measures: [
    {
      name: 'instance_memory',
      unit: 'GIGABYTE'
    },
    {
      name: 'running_instances',
      unit: 'NUMBER'
    }],
  metrics: [
    {
      name: 'memory',
      unit: 'GIGABYTE',

      meter: ((m) => ({
        consuming: m.instance_memory * m.running_instances,
        since: m.start
      })).toString(),

      accumulate: ((a, qty) => ({
        consumed: a ?
          a.consumed + a.consuming * (qty.since - a.since) : 0,
        consuming: qty.consuming,
        since: qty.since
      })).toString(),

      aggregate: ((a, prev, curr) => {
        const consuming = curr.consuming - (prev ? prev.consuming : 0);
        return a ? {
          consumed: a.consumed +
            a.consuming * Math.max(0, curr.since - a.since) +
            consuming * Math.max(0, a.since - curr.since),
          consuming: a.consuming + consuming,
          since: Math.max(a.since, curr.since)
        } : {
          consumed: 0,
          consuming: consuming,
          since: curr.since
        };

      }).toString(),

      rate: ((price, qty) => ({
        burned: qty.consumed * price,
        burning: qty.consuming * price,
        since: qty.since
      })).toString(),

      charge: ((t, cost) => cost.burned +
        cost.burning * Math.max(0, t - cost.since) / 1000).toString()
    }]
};
