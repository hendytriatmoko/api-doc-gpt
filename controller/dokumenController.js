const json = require('body-parser');
const modelVpr = require('../model/vprModel');
const fs = require('fs');
const path = require('path');
const moment = require('moment')
require('dotenv').config();
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { Document } = require('docx');
const mammoth = require('mammoth');
const db = require('../database/config');
// Import OpenAI library
const OpenAI = require('openai');
const { promisify } = require('util');
const axios = require('axios');

// Inisialisasi OpenAI dengan API Key
const apiGemini = process.env.keygemini
const openai = new OpenAI({
    apiKey: process.env.key
    });

// async function postOcrDokumen(req,res){ 
//     return res.status(200).json(req.query);
// }

async function postOcrDokumen (req, res) {
    // Mengakses file yang diunggah
    const file = req.file;
    const { id_file, user_id } = req.body;
    
    if (!file) {
        return res.status(400).send({ message: 'No file uploaded.' });
    }

    const filePath = path.join(__dirname, '../file/source', file.filename);
    const fileExtension = path.extname(file.filename).toLowerCase();
    let extractedText = '';


    try{
        if (fileExtension === '.pdf') {
            // Ekstraksi teks dari PDF
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text;

        } else if (['.jpg', '.jpeg', '.png', '.tiff'].includes(fileExtension)) {
            // OCR untuk gambar
            const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
            extractedText = text;

        } else if (fileExtension === '.docx') {
            // Ekstraksi teks dari DOCX
            const result = await mammoth.extractRawText({ path: filePath });
            extractedText = result.value;

        } else if (fileExtension === '.txt') {
            // Membaca teks langsung dari file TXT
            extractedText = fs.readFileSync(filePath, 'utf8');

        } else {
            return res.status(400).send({ message: 'Unsupported file format.' });
        }

        extractedText = extractedText.replace(/\n{2,}/g, '\n').trim();
        const outputFilePath = path.join(__dirname, '../file/ekstrak', `${path.basename(file.filename, fileExtension)}_extracted.txt`);
        fs.writeFileSync(outputFilePath, extractedText.trim(), 'utf8');


        // Contoh: Mengembalikan respon dengan informasi file
        res.status(200).send({
            message: 'File uploaded successfully.',
            originalname: file.originalname,  // Nama file asli sebelum diubah
            filename: file.filename,  // Nama file yang telah diubah
            filepath: path.join(__dirname, '../file/source', file.filename),
            extractedText: extractedText.trim() 
        });
    } catch (error) {
        console.error('Error extracting text:', error);
        res.status(500).send({ message: 'Error extracting text from the document.' });
    }


    // Anda dapat menambahkan kode untuk memproses file OCR di sini
};


async function postOcrDokumenAll (req, res) {
    const { user_id,nama } = req.body;
    const uploadedFiles = req.files;

    let fileNames = [
    ];

    // Mendapatkan nama file dari uploadedFiles
    if (uploadedFiles) {
        // Melakukan iterasi untuk setiap field file (misal: file1, file2, dll.)
        for (let field in uploadedFiles) {
            for (const file of uploadedFiles[field]){
            // uploadedFiles[field].forEach(file => {
                const filePath = path.join(__dirname, '../file/source', file.filename);
                const fileExtension = path.extname(file.filename).toLowerCase();
                let extractedText = '';
                try{
                    if (fileExtension === '.pdf') {
                        // Ekstraksi teks dari PDF
                        const dataBuffer = fs.readFileSync(filePath);
                        const pdfData = await pdfParse(dataBuffer);
                        extractedText = pdfData.text;
            
                    } else if (['.jpg', '.jpeg', '.png', '.tiff'].includes(fileExtension)) {
                        // OCR untuk gambar
                        const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
                        extractedText = text;
            
                    } else if (fileExtension === '.docx') {
                        // Ekstraksi teks dari DOCX
                        const result = await mammoth.extractRawText({ path: filePath });
                        extractedText = result.value;
            
                    } else if (fileExtension === '.txt') {
                        // Membaca teks langsung dari file TXT
                        extractedText = fs.readFileSync(filePath, 'utf8');
            
                    } else {
                        return res.status(400).send({ message: 'Unsupported file format.' });
                    }
            
                    extractedText = extractedText.replace(/\n{2,}/g, '\n').trim();
                    fileNames.push(
                        {
                            filename: file.filename,
                            teks: extractedText
                        }                        
                    )
                    // const outputFilePath = path.join(__dirname, '../file/ekstrak', `${path.basename(file.filename, fileExtension)}_extracted.txt`);
                    // fs.writeFileSync(outputFilePath, extractedText.trim(), 'utf8');
                }catch(error){
                    console.error('Error extracting text:', error);
                    res.status(500).send({ message: 'Error extracting text from the document.' });
                }

                // fileNames.push(file.filename); // Menyimpan nama file ke array
            };
        }
    }

    let dataPrompt = `
    berikut adalah capaian pembelajaran
    ${fileNames[0].teks ? fileNames[0].teks : '-'}

    berikut adalah materi pembelajaran
    ${fileNames[1].teks ? fileNames[1].teks : '-'}

    berikut adalah soal tugas pembelajaran
    ${fileNames[2].teks ? fileNames[2].teks : '-'}

    berikut adalah pedoman penskoran
    ${fileNames[3].teks ? fileNames[3].teks : '-'}

    berikut adalah jawaban mahasiswa
    ${fileNames[4].teks ? fileNames[4].teks : '-'}
    
    berikut adalah yang akan saya minta
    1. berikan nilai skala 1-100 capaian pembelajarannya dengan aspek relevansi,kejelasan rumusan, keterukuran, kesesuaian dengan taksonomi bloom
    2. ukur capaian pembelajaran dari materi pembelajaran diatas
    3. ukur capaian pembelajaran pada soal tugas
    4. berikan penilaian 1-100 untuk masing masing mahasiswa pada jawaban tugas sertakan alasannya dan dalam bentuk tabel
    5. identifikasi persentase capaian pembelajaran yang belum dikuasai oleh sebagian besar mahasiswa dalam grafik batang
    6. berikan usulan perbaikan pembelajaran relevan pada instruktur terkait capaian pembelajaran yang belum dikuasai sebagian besar mahasiswa
    `
    let timestamp = moment().format('YYYYMMDDhhmmss');
    let fileekstrak = `${user_id}-file_extracted${timestamp}.txt`
    const outputFilePath = path.join(__dirname, '../file/ekstrak', fileekstrak);
    fs.writeFileSync(outputFilePath, dataPrompt.trim(), 'utf8');


    try{
        const query = 'INSERT INTO t_file (id_user,nama, file1, file2, file3, file4, file5, file_prompt) VALUES (?,?, ?, ?,?, ?,?, ?)';
        db.query(query, [
                user_id, 
                nama,
                fileNames[0].filename, 
                fileNames[1].filename, 
                fileNames[2].filename, 
                fileNames[3].filename, 
                fileNames[4].filename, 
                fileekstrak
            ], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
    
            res.status(200).send({
                message: 'File uploaded successfully.',
                user_id: user_id,
                file: fileNames
            });
        });
    

    }catch(error){
        console.error('Error extracting text:', error);
        res.status(500).send({ message: 'Error upload doc from the document.' });
    }
    
}

async function getDokumenAll (req, res){
    const { id_user } = req.query 
    // console.log('req', req.query)

    try{
        const query = 'select * from t_file where id_user = ?';
        db.query(query, [id_user], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result',result)
            

            res.status(200).send({
                message: 'success.',
                id_user: id_user,
                file: result
            });
        })
        
    }catch(error){
        res.status(500).send({ message: 'Error get the document.' });
    }

    
}

// async function postgpt (req, res){
//     const { id_file } = req.body 

//     try{
//         const query = 'select file_prompt from t_file where id = ?';
//         db.query(query, [id_file], (err, result) => {
//             if (err) {
//                 return res.status(500).json({ error: err.message });
//             }

//             const filePath = path.join(__dirname, '../file/ekstrak', result[0].file_prompt);
//             var extractedText = fs.readFileSync(filePath, 'utf8');
//             let output = await generateGpt(extractedText)
//             res.status(200).send({
//                 message: 'success.',
//                 id_file: id_file,
//                 result: output
//             });

            
//         })
        
//     }catch(error){
//         res.status(500).send({ message: 'Error get the document.' });
//     }

    
// }

// async function generateGpt(text) {
//     try {
//         // Mengirimkan permintaan ke model GPT
//         const outputStream = fs.createWriteStream("output.txt");

//         const stream = await openai.chat.completions.create({
//             model: "gpt-4o-mini", // Pastikan menggunakan model yang valid
//             messages: [{ role: "user", content: text }],
//             stream: true,
//         }, { responseType: 'stream' });

//         // Menggunakan streaming untuk menampilkan respons
//         let output = ''
//         for await (const chunk of stream) {
//             output += chunk.choices[0]?.delta?.content || "";
//             // process.stdout.write(chunk.choices[0]?.delta?.content || "")
//         }
//         return output;
        

//     } catch (error) {
//         console.error("Terjadi kesalahan:", error);
//     }
// }

async function postgpt(req, res) {
    const { id_file } = req.body;

    try {
        // Mengubah db.query menjadi versi async menggunakan promisify
        const queryAsync = promisify(db.query).bind(db);
        
        // Mendapatkan file_prompt berdasarkan id_file
        const query = 'SELECT file_prompt FROM t_file WHERE id = ?';
        const result = await queryAsync(query, [id_file]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Mendapatkan path file dan membaca teks yang diekstraksi
        const filePath = path.join(__dirname, '../file/ekstrak', result[0].file_prompt);
        var extractedText = fs.readFileSync(filePath, 'utf8');

        // Memanggil fungsi generateGpt untuk menghasilkan output
        let {output,totalTokens} = await generateGpt(extractedText);

        console.log('ss',totalTokens)

        let timestamp = moment().format('YYYYMMDDhhmmss');
        let fileresult = `${id_file}-file_result${timestamp}.txt`
        const outputFilePath = path.join(__dirname, '../file/result', fileresult);
        fs.writeFileSync(outputFilePath, output.trim(), 'utf8');

        // Mengirimkan respons sukses
        const queryInsert = 'insert into t_result (id_file,type,file) values (?,0,?)'
        // const queryUpdate = 'update t_file set file_result = ? where id = ?';
        db.query(queryInsert, [id_file,fileresult], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result',result)
            

            res.status(200).send({
                message: 'success',
                id_file: id_file,
                result: output
            });
        })
        

    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error getting the document.' });
    }
}

// async function generateGpt(text) {
//     try {
//         // Mengirimkan permintaan ke model GPT
//         const stream = await openai.chat.completions.create({
//             model: "gpt-4o-mini", // Pastikan menggunakan model yang valid
//             messages: [{ role: "user", content: text }],
//             stream: true,
//         }, { responseType: 'stream' });

//         // Menggunakan streaming untuk menghasilkan respons
//         let output = '';
//         for await (const chunk of stream) {
//             output += chunk.choices[0]?.delta?.content || "";
//         }
//         return output;

//     } catch (error) {
//         console.error("Terjadi kesalahan saat generate GPT:", error);
//         throw new Error('Error generating GPT output.');
//     }
// }

async function generateGpt(text) {
    try {
        // Mengirimkan permintaan ke model GPT tanpa batasan max_tokens
        const response = await openai.chat.completions.create({
            model: "gpt-4", // Pastikan menggunakan model yang valid
            messages: [{ role: "user", content: text }]
        });

        // Ambil konten dari respons
        const output = response.choices[0].message.content;

        // Dapatkan informasi token dari response.usage
        const totalTokens = response.usage.total_tokens;
        // const promptTokens = response.usage.prompt_tokens;
        // const completionTokens = response.usage.completion_tokens;

        // Return output dan total token
        return {
            output,
            totalTokens
        };

    } catch (error) {
        console.error("Terjadi kesalahan saat generate GPT:", error);
        throw new Error('Error generating GPT output.');
    }
}


async function getResult(req,res){
    const { nama_file } = req.query;

    try{

    
        const queryAsync = promisify(db.query).bind(db);
    const query = `SELECT a.file,c.id 'id_user',c.nama 'nama_user', d.nama 'nama_universitas' FROM t_result a left join t_file b on a.id_file = b.id left join t_user c on b.id_user = c.id left join t_universitas d on c.id_universitas = d.id WHERE file = ?`
    // // Mendapatkan file_prompt berdasarkan id_file
    // // const query = 'SELECT file_prompt FROM t_file WHERE id = ?';
    const result = await queryAsync(query, [nama_file]);

    if (result.length === 0) {
        return res.status(404).json({ message: 'File not found.' });
    }

    // Mendapatkan path file dan membaca teks yang diekstraksi
    const filePath = path.join(__dirname, '../file/result', nama_file);
    var extractedText = fs.readFileSync(filePath, 'utf8');
    res.status(200).send({
        message: 'success',
        nama_file: nama_file,
        result: result[0],
        text:extractedText
    });
    // db.query(query, [id_file], (err, result) => {
    //     if (err) {
    //         return res.status(500).json({ error: err.message });
    //     }

    //     const filePath = path.join(__dirname, '../file/result', result);
    //     // const fileExtension = path.extname(file.filename).toLowerCase();
    //     let extractedText = '';
    //     extractedText = fs.readFileSync(filePath, 'utf8');



    //     console.log('result',result)
        

    //     res.status(200).send({
    //         message: 'success',
    //         id_file: id_file,
    //         result: result,
    //         text:extractedText
    //     });
    // })
}catch(error){
    console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error getting the document.' });
}

}

async function getfile(req,res){
    const { id_user } = req.query;

    try{
        const queryAsync = promisify(db.query).bind(db);

        const queryfile = `select * from t_file where id_user = ? order by updated_at desc`;
        console.log('ss',queryfile)
        const datagetfile = await queryAsync(queryfile, [id_user]);

        const id_file_list = datagetfile.map(item => item.id).join(`','`);

        
        const queryresult = `select * from t_result where id_file in ('${id_file_list}') order by datetime desc`;
        console.log('ss',queryresult)
        const datagetresult = await queryAsync(queryresult);


        for (let i = 0; i < datagetfile.length; i++) {
            var data = []
            for (let j = 0; j < datagetresult.length; j++) {
                if (datagetfile[i].id === datagetresult[j].id_file) {
                    data.push(datagetresult[j])
                }
            }
            datagetfile[i].fileresult = data
        }
        
        // Mendapatkan file_prompt berdasarkan id_file
        // const query = `select 
        //                 a.* ,
        //                 b.id_file,
        //                 b.file,
        //                 b.datetime,
        //                 b.type
        //                 from t_file a 
        //                 left join t_result b on a.id = b.id_file
        //             where a.id_user = ? order by a.updated_at desc`
        // const query1 = `select * from t_file a
        //         where a.id_user = ? order by a.updated_at desc`

        
        // const dataget = await queryAsync(query1, [id_user]);
        // const result = dataget

        // const resultfile = []
        // const resultgpt = []
        // for (let i = 0; i < result.length; i++) {
        //     const isIdOneExists = resultfile.some(file => file.id === result[i].id);
        //     if (isIdOneExists) {
        //         // console.log('ID 1 already exists');
        //     } else {
        //         const data = {
        //             id: result[i].id,
        //             id_user: result[i].id_user,
        //             nama: result[i].nama,
        //             file1: result[i].file1,
        //             file2: result[i].file2,
        //             file3: result[i].file3,
        //             file4: result[i].file4,
        //             file5: result[i].file5,
        //             file_prompt: result[i].file_prompt,
        //             file_result: result[i].file_result,
        //             updated_at: result[i].updated_at,
        //             fileresult: []
        //         }
        //         resultfile.push(data)
        //     }
        //     const resgpt = {
        //         id_file:result[i].id_file,
        //         file: result[i].file,
        //         type: result[i].type,
        //         datetime:result[i].datetime
        //     }
        //     // if (data.id === resgpt.id_file) {
        //     //     data.fileresult.push(resgpt)
        //     // }


        //     resultgpt.push(resgpt)
        // }
        
        // for (let i = 0; i < resultfile.length; i++) {
        //     for (let j = 0; j < resultgpt.length; j++) {
        //         if (resultfile[i].id === resultgpt[j].id_file) {
        //             resultfile[i].fileresult.push(resultgpt[j])
        //         }
        //     }
        // } 
    
        res.status(200).send({
            message: 'success',
            id_user: id_user,
            result: datagetfile,
        });
    }catch(error){
        res.status(400).send({
            message: 'file tidak ditemukan',
            error: error.message
        });
    }
    // try{
}

async function downloadSource(req, res){
    const { nama_file,type } = req.body;
    // const fileName = req.query.file;

    // if (!fileName) {
    //     return res.status(400).json({ error: 'File name is required' });
    // }

    // Menentukan path lengkap file yang akan diunduh
    const filePath = path.join(__dirname, `../file/${type}`, nama_file);

    // Mengirim file untuk diunduh
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error during file download:', err);
            res.status(500).send('Error downloading file');
        }
    });
    // res.status(200).send({
    //     message: 'download success',
    // });
}

async function postgptgemini(req,res) {
    const { id_file } = req.body;
    try{
        const queryAsync = promisify(db.query).bind(db);
        
        // Mendapatkan file_prompt berdasarkan id_file
        const query = 'SELECT file_prompt FROM t_file WHERE id = ?';
        const result = await queryAsync(query, [id_file]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Mendapatkan path file dan membaca teks yang diekstraksi
        const filePath = path.join(__dirname, '../file/ekstrak', result[0].file_prompt);
        var extractedText = fs.readFileSync(filePath, 'utf8');


        let output = await generateGptGemini(extractedText);



        let timestamp = moment().format('YYYYMMDDhhmmss');
        let fileresult = `${id_file}-file_result${timestamp}.txt`
        const outputFilePath = path.join(__dirname, '../file/result', fileresult);
        fs.writeFileSync(outputFilePath, output.trim(), 'utf8');

        // Mengirimkan respons sukses
        const queryInsert = 'insert into t_result (id_file,type,file) values (?,1,?)'
        // const queryUpdate = 'update t_file set file_result = ? where id = ?';
        db.query(queryInsert, [id_file,fileresult], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result',result)
            

            res.status(200).send({
                message: 'success',
                id_file: id_file,
                result: output
            });
        })

        



        res.status(200).send({
            message: 'success',
            extractedText: output
            // id_file: id_file,
            // result: output
        });

    }catch(error){
        res.status(500).send('Error post gemini');
    }
}

async function generateGptGemini(text) {
    const requestBody = {
        "contents": [
          {
            "parts": [
              {
                "text": text
              }
            ]
          }
        ]
      };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiGemini}`;
    try {
        const response = await axios.post(url, requestBody, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          const data = response.data.candidates[0].content.parts[0].text
          return data;
          console.log('Response data:', data);

    } catch (error) {
        console.error("Terjadi kesalahan saat generate GPT:", error);
        throw new Error('Error generating GPT output.');
    }
}

async function getalldata(req,res){
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = `select a.id 'id_user', a.nama 'nama_user',b.nama 'nama_universitas'  from t_user a
        left join t_universitas b on a.id_universitas = b.id`;
        const dataget = await queryAsync(query);

        const id_user_list = dataget.map(item => item.id_user).join(`','`);

        const queryfile = `select * from t_file where id_user in ('${id_user_list}') order by updated_at desc`;
        console.log('ss',queryfile)
        const datagetfile = await queryAsync(queryfile);

        const id_file_list = datagetfile.map(item => item.id).join(`','`);

        
        const queryresult = `select * from t_result where id_file in ('${id_file_list}') order by datetime desc`;
        console.log('ss',queryresult)
        const datagetresult = await queryAsync(queryresult);
        
        
        for (let i = 0; i < datagetfile.length; i++) {
            var data = []
            for (let j = 0; j < datagetresult.length; j++) {
                if (datagetfile[i].id === datagetresult[j].id_file) {
                    data.push(datagetresult[j])
                }
            }
            datagetfile[i].result = data
        }

        for (let i = 0; i < dataget.length; i++) {
            var data = []
            for (let j = 0; j < datagetfile.length; j++) {
                if (dataget[i].id_user === datagetfile[j].id_user) {
                    data.push(datagetfile[j])
                }
            }
            dataget[i].file = data
        }
        const result = dataget

        res.status(200).send({
            message: 'success',
            // hashed: hashedPassword,
            result: dataget
        });

    }catch(error){
        res.status(500).send({
            message: 'Error in get user',
            error: error.message
        });
        
    }
}

async function deletefile(req,res){
    const { id_file } = req.body;
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = 'delete from t_file where id = ?';
        const dataget = await queryAsync(query,[id_file]);
        // const result = dataget

        res.status(200).send({
            message: 'success',
            // hashed: hashedPassword,
            result: dataget
        });

    }catch(error){
        res.status(500).send({
            message: 'Error in get user',
            error: error.message
        });
        
    }
}

module.exports = { 
    postOcrDokumen,postOcrDokumenAll,getDokumenAll,postgpt,getResult,getfile,downloadSource,postgptgemini,getalldata,deletefile
};