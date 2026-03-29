// ════════════════════════════════════════════════════════
// MÁQUINA LUCRATIVA — Sistema de Captura de Leads
// ID da planilha já configurado — só implantar!
// ════════════════════════════════════════════════════════

const SHEET_ID = '1rmPKjEM-LQiPS5NsL2l6gRBpp0imgThtRrlf1OvJIF0';
const SHEET_NAME = 'Leads';

const CORES = {
  'novo_lead':     { bg: '#FFF9C4', font: '#7B6B00' },
  'follow_up_r67': { bg: '#FFE0B2', font: '#B34A00' },
  'comprou':       { bg: '#C8E6C9', font: '#1B5E20' },
  'nao_comprou':   { bg: '#FFCDD2', font: '#B71C1C' },
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const h = ['Data/Hora','Nome','WhatsApp','Link Follow-up R$67','Status','Observacoes'];
      sheet.appendRow(h);
      const hr = sheet.getRange(1,1,1,h.length);
      hr.setBackground('#0A0A0A');
      hr.setFontColor('#C9A84C');
      hr.setFontWeight('bold');
      hr.setFontSize(11);
      sheet.setFrozenRows(1);
      [170,150,140,280,120,200].forEach((w,i)=>sheet.setColumnWidth(i+1,w));
    }

    const phone  = (data.phone||'').replace(/[^0-9]/g,'');
    const name   = (data.name||'').trim();
    const status = data.status || 'novo_lead';

    // Atualiza status se lead já existe
    if (status !== 'novo_lead') {
      if (updateStatus(sheet, phone, status)) {
        return ok({ action: 'updated' });
      }
    }

    const followMsg =
      'Oi ' + name + '! Percebi que você viu a Máquina Lucrativa mas ainda não garantiu seu acesso 💛\n\n' +
      'Preparei uma condição especial de R$67 pra você começar hoje.\n\n' +
      '👉 https://pay.hotmart.com/K104985899E\n\n' +
      'Qualquer dúvida me chama 😊';

    const link = 'https://wa.me/55' + phone + '?text=' + encodeURIComponent(followMsg);
    const now = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');

    sheet.appendRow([now, name, phone, link, status, '']);

    const row = sheet.getLastRow();
    const cor = CORES[status] || CORES['novo_lead'];
    const cell = sheet.getRange(row, 5);
    cell.setBackground(cor.bg);
    cell.setFontColor(cor.font);
    cell.setFontWeight('bold');

    // Formata o link da coluna D como hiperlink clicável
    const linkCell = sheet.getRange(row, 4);
    linkCell.setFormula('=HYPERLINK("' + link + '","Clique para enviar")');
    linkCell.setFontColor('#1155CC');

    return ok({ action: 'created' });

  } catch(err) {
    return ok({ error: err.toString() });
  }
}

function updateStatus(sheet, phone, newStatus) {
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][2]).replace(/[^0-9]/g,'') === phone) {
      const cor = CORES[newStatus] || CORES['novo_lead'];
      const cell = sheet.getRange(i+1, 5);
      cell.setValue(newStatus);
      cell.setBackground(cor.bg);
      cell.setFontColor(cor.font);
      return true;
    }
  }
  return false;
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ok({ status: 'webhook ativo' });
}
