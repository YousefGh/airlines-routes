var express = require('express');
var router = express.Router();
var unzip = require('unzip');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {

  // var dirPath  = __dirname + "/../public/routes.zip";
  // var destPath = __dirname + "/../public/routes";

  // fs.createReadStream(dirPath).pipe(unzip.Extract({ path: destPath }));
  // // res.redirect('/');
  
  res.render('index', { title: 'Airlines Routes' });
});

module.exports = router;