// ════════════════════════════════════════════════════════
// MÁQUINA LUCRATIVA — Sistema de Captura de Leads
// Google Apps Script — Cole no script.google.com
// ════════════════════════════════════════════════════════

// Substitua pelo ID da sua planilha Google Sheets
// O ID esta na URL: docs.google.com/spreadsheets/d/ESTE_TRECHO/edit
const SHEET_ID = '1rmPKjEM-LQiPS5NsL2l6gRBpp0imgThtRrlf1OvJIF0';
const SHEET_NAME = 'Leads';

const STATUS_CORES = {
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
      const headers = ['Data/Hora','Nome','WhatsApp','Link Direto','Status','Mensagem Follow-up','Observacoes'];
      sheet.appendRow(headers);
      const hr = sheet.getRange(1, 1, 1, headers.length);
      hr.setBackground('#0A0A0A');
      hr.setFontColor('#C9A84C');
      hr.setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1,150); sheet.setColumnWidth(2,150);
      sheet.setColumnWidth(3,140); sheet.setColumnWidth(4,220);
      sheet.setColumnWidth(5,130); sheet.setColumnWidth(6,380);
      sheet.setColumnWidth(7,200);
    }

    const phone  = (data.phone  || '').replace(/[^0-9]/g, '');
    const name   = (data.name   || '').trim();
    const status = data.status  || 'novo_lead';

    if (status === 'follow_up_r67') {
      const updated = updateLeadStatus(sheet, phone, 'follow_up_r67');
      if (updated) return jsonResponse({ success: true, action: 'status_updated' });
    }

    const followUpMsg =
      'Oi ' + name + '! Percebi que voce conheceu a Maquina Lucrativa mas ainda nao garantiu seu acesso\n\n' +
      'Como voce chegou ate o final, preparei uma condicao especial de R$67 pra voce comecar hoje.\n\n' +
      'Acessa aqui: https://pay.hotmart.com/K104985899E\n\n' +
      'Qualquer duvida me chama aqui!';

    const whatsappLink = 'https://wa.me/55' + phone + '?text=' + encodeURIComponent(followUpMsg);
    const now = new Date();

    sheet.appendRow([
      Utilities.formatDate(now, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'),
      name, phone, whatsappLink, status, followUpMsg, ''
    ]);

    const lastRow = sheet.getLastRow();
    const cor = STATUS_CORES[status] || STATUS_CORES['novo_lead'];
    const cell = sheet.getRange(lastRow, 5);
    cell.setBackground(cor.bg);
    cell.setFontColor(cor.font);
    cell.setFontWeight('bold');

    return jsonResponse({ success: true, action: 'lead_created' });

  } catch(err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function updateLeadStatus(sheet, phone, newStatus) {
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][2]).replace(/[^0-9]/g,'') === phone) {
      const cor = STATUS_CORES[newStatus] || STATUS_CORES['novo_lead'];
      const cell = sheet.getRange(i + 1, 5);
      cell.setValue(newStatus);
      cell.setBackground(cor.bg);
      cell.setFontColor(cor.font);
      return true;
    }
  }
  return false;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return jsonResponse({ status: 'Webhook ativo.' });
}
