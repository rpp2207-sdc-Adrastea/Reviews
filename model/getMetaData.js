const db = require('./index.js');

module.exports = {
  getMeta: (params) => {

    return new Promise((resolve, reject) => {

    console.log("CALLING METADATA 🐡")

    let product_id = params.product_id;

    let resObj = {
      "product_id": product_id
    }

    // Needs for ResOBJ:
    // - ratings: from results table
    // - recommended: from results table
    // - characteristics: from characteristics and characteristic reviews
    // SELECT *
    // FROM characteristics
    // JOIN characteristics_reviews
    // ON characteristics.id = characteristics_reviews.characteristic_id
    // WHERE characteristics.product_id = 71669;

    // RATINGS AND REC Q: `SELECT rating, recommend FROM results WHERE product_id = ${product_id}`
    // still need to make data into correct shape



    // takes in 6 calls, all for different product ID's

    // characteristics_reviews

    // +------+-------------------+-----------+-------+
    // | id   | characteristic_id | review_id | value |
    // +------+-------------------+-----------+-------+
    // |    1 |                 1 |         1 |     4 |

    // characteristics

    // +------+------------+-------+
    // | id   | product_id | name  |
    // +------+------------+-------+
    // |    1 |          1 | "Fit" |
    // +------+------------+-------+

    // characteristic

    //hyp:
    // characteristics.id = characteristics_reviews.characteristic_id


    let ratQuery = `SELECT rating, recommend FROM results WHERE product_id = ${product_id}`;
    const ratsAndRec = new Promise((resolve , reject) => {
      db.connection.query(ratQuery, (err, results, fields) => {
        if (err) reject(err);

        resolve(results);
      })
    })

    let charQuery =
    `SELECT *
    FROM characteristics
    JOIN characteristics_reviews
    ON characteristics.id = characteristics_reviews.characteristic_id
    WHERE characteristics.product_id = 71669`

    const chars = new Promise((resolve , reject) => {
      db.connection.query(charQuery, (err, results, fields) => {
        if (err) reject(err);

        resolve(results);
      })
    })

    Promise.all([ratsAndRec, chars])
      .then((data) => {
        // console.log('data from promise.all, ', data);

        // consider adding different middleware files
        // transform data:

        let ratingObj = {};
        let recObj = {};
        let charsObj = {};
        let charCount = {};

        let ratsAndRecs = data[0];
        let charsRes = data[1];

        ratsAndRecs.forEach((obj) => {
          let curRating = obj.rating;
          let curRec = obj.recommend;

          if (ratingObj[curRating] === undefined) {
            ratingObj[curRating]= 1;
          } else {
            ratingObj[curRating]++;
          }

          if (recObj[curRec] === undefined) {
            recObj[curRec] = 1;
          } else {
            recObj[curRec]++;
          }

        })

        // console.log('charsRes', charsRes)

        charsRes.forEach((obj) => {
          let curChar = obj.name;
          let curVal = obj.value

          if (charCount[curChar] === undefined) {
            charCount[curChar] = 1;
          } else {
            charCount[curChar]++;
          }

          if (charsObj[curChar] === undefined) {
            delete obj.name;
            charsObj[curChar] = obj;
          } else {
            charsObj[curChar].value += curVal;
          }

        })


        Object.keys(charsObj).forEach((key) => {
          charsObj[key].value = charsObj[key].value / charCount[key];
        })

        // console.log('charsObj', charsObj)

        resObj['ratings'] = ratingObj;
        resObj["recommended"] = recObj;
        resObj["characteristics"] = charsObj;

        resolve(resObj)
        // return resObj
      })
      .catch((err) => {
        console.log('metadata prmise/all  error ', err);
      })

    });

  }
}