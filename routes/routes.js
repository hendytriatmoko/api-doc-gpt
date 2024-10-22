const express = require('express')
const bodyParser = require('body-parser');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const dokumenController = require('../controller/dokumenController.js')
const userController = require('../controller/userController.js')
const database = require('../database/config.js')
const moment = require('moment')

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      // Menyimpan file yang diunggah dalam folder 'uploads'
      cb(null, path.join(__dirname, '../file/source'));
  },
  // filename: (req, file, cb) => {
  //     // Menyimpan file dengan nama asli
  //     namaFile = file.originalname.replace(/[^a-zA-Z0-9_]/g, '').replace(/\s+/g, '_')
  //     let timestamp = moment().format('YYYYMMDDhhmmss')
  //     let extension = path.extname(file.originalname);
  //     let basename = path.basename(namaFile, extension);
  //     let newFilename = `${basename}-${timestamp}${extension}`;
  //     cb(null, newFilename);
  // }
  filename: (req, file, cb) => {
    let timestamp = moment().format('YYYYMMDDhhmmss');
    let extension = path.extname(file.originalname);
  
    // Menghapus spasi dan karakter khusus, menggantinya dengan underscore
    let basename = path.basename(file.originalname, extension)
      .replace(/\s+/g, '_')         // Mengganti spasi dengan _
      .replace(/[^a-zA-Z0-9_]/g, '') // Menghapus karakter selain huruf, angka, dan underscore
  
    // Gabungkan dengan timestamp dan simpan file dengan nama baru
    let newFilename = `${basename}-${timestamp}${extension}`;
    cb(null, newFilename);
  }
});

// Inisialisasi multer dengan konfigurasi penyimpanan
const upload = multer({ storage: storage });



router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/test', (req, res) => {
  res.json({ message: 'You have access to this protected route! yaa', data: req.query });
});


// router.post('/dokumenController' ,dokumenController.postOcrDokumen)
// Rute untuk post dokumen dengan file unggahan
router.post('/postDokumen', upload.single('file'), dokumenController.postOcrDokumen);


router.post('/adduser', upload.none(), userController.addUser)

router.get('/getuser', upload.none(), userController.getuser)

router.put('/putuser', upload.none(), userController.putuser)

router.post('/login', upload.none(), userController.loginUser)

router.get('/listfile', upload.none(), dokumenController.getDokumenAll)

router.get('/getfile', upload.none(), dokumenController.getfile)


router.get('/getresult', upload.none(), dokumenController.getResult)
router.post('/download_file', upload.none(), dokumenController.downloadSource)

router.post('/postgpt', upload.none(), dokumenController.postgpt)

router.post('/postgptgemini', upload.none(), dokumenController.postgptgemini)



router.post('/postfile', upload.fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 },
  { name: 'file3', maxCount: 1 },
  { name: 'file4', maxCount: 1 }
]), dokumenController.postOcrDokumenAll)

// router.post('/adduser', upload.none(), userController.addUser)





// router.post('/postvpr' ,vprController.postVpr)
// router.get('/getvendor' ,vprController.getVendor)

// router.post('/AreaBesar',SoaController.GetDataSoaByAreaBesar)
// router.post('/monthYear',SoaController.GetAmountDaMonthYear)
// router.get('/filtering',SoaController.getFiltering)
// router.post('/topTenOverdue',SoaController.getTopTenOverdue)

module.exports = router;