const keystone  = require('keystone');
const Excel     = require('exceljs');
const Question  = keystone.list('Question');

const CHOICE_TYPE       = '单选';
const MULT_CHOICES_TYPE = '多选';
const CLOZE_TYPE        = '填空';
const TYPES_MAP         = {
  [CHOICE_TYPE]         : 'choice',
  [MULT_CHOICES_TYPE]   : 'multiple-choices',
  [CLOZE_TYPE]          : 'cloze'
};

exports = module.exports = function (req, res) {
  var view   = new keystone.View(req, res);
  var locals = res.locals;

  // Set locals
  locals.section   = 'upload_xlsx';
  locals.submitted = false;

  // On POST requests, add the Enquiry item to the database
  view.on('post', { action: 'import' }, function (next) {
    xlsx2json(req.files.file.path).then(questions => {
      Promise.all((questions || []).map(q => new Promise((resolve, reject) => {
        new Question.model({
          name: q.question,
          type: TYPES_MAP[q.type] || TYPES_MAP[CHOICE_TYPE],
          weight: q.weight,
          score: q.score,
          options: q.options || [],
          answer: q.answer
        }).save((err, item) => {
          if (err) reject(err);
          resolve(item);
        });
      }))).then(arr => {
        locals.submitted = true;
        locals.count = arr.length;

        next();
      }, err => {
        locals.submitted = true;
        locals.error = JSON.stringify(err);

        next();
      });
    });
  });

  view.render('upload_xlsx');
};

function xlsx2json(filename) {
  const sheets = [];

  return new Excel.Workbook().xlsx.readFile(filename).then(worksheets => {
    worksheets.eachSheet(worksheet => {
      worksheet.eachRow((row, rowNumber) => {
        if ( rowNumber === 1 ) { // 列表标题
          return;
        }

        const item = {
          type: '',
          question: '',
          options: [],
          answer: '',
          weight: 0,
          score: 0
        };

        row.eachCell({
          includeEmpty: true
        }, (cell, colNumber) => {
          let text = _text(cell.value);

          switch(colNumber) {
            case 1:
              item.type = text;
              break;
            case 2:
              item.question = text;
              break;
            case 3:
              text && item.options.push(`A. ${text}`);
              break;
            case 4:
              text && item.options.push(`B. ${text}`);
              break;
            case 5:
              text && item.options.push(`C. ${text}`);
              break;
            case 6:
              text && item.options.push(`D. ${text}`);
              break;
            case 7:
              text && item.options.push(`E. ${text}`);
              break;
            case 8:
              text && item.options.push(`F. ${text}`);
              break;
            case 9:
              if (item.type === MULT_CHOICES_TYPE) {
                item.answer = text.split('').join(',');
              } else {
                item.answer = text;
              }
              break;
            case 10:
              item.weight = parseInt(text, 10) || 0;
              break;
            case 11:
              item.score = parseInt(text, 10) || 0;
              break;
          }
        });

        sheets.push(item);
      });
    });

    return sheets;
  });
}

function _isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function _text(value) {
  if ( typeof value === 'string' || !value ) {
    return value;
  }

  if ( _isObject(value) && value.richText ) {
    let pText = '';

    (value.richText || []).forEach( item => {
      pText += item.text;
    });

    return pText;
  }

  return JSON.stringify(value);
}