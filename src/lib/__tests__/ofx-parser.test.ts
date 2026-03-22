import { describe, it, expect } from 'vitest';
import {
  parseOFX,
  parseCSV,
  parseExtratoBancario,
} from '../ofx-parser';

describe('OFX/CSV Parser', () => {
  // ========================
  // parseOFX
  // ========================
  describe('parseOFX', () => {
    it('arquivo vazio retorna erro', () => {
      const r = parseOFX('', 'test.ofx');
      expect(r.sucesso).toBe(false);
    });

    it('arquivo sem transações retorna erro', () => {
      const r = parseOFX('<OFX><BANKID>001</BANKID></OFX>', 'test.ofx');
      expect(r.sucesso).toBe(false);
      expect(r.erro).toContain('Nenhuma transação');
    });

    it('extrai dados da conta bancária', () => {
      const ofx = `
        <OFX>
          <BANKID>001
          <BRANCHID>1234
          <ACCTID>56789-0
          <ACCTTYPE>CHECKING
          <CURDEF>BRL
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20240115
            <TRNAMT>-150.50
            <FITID>TX001
            <NAME>Pagamento fornecedor
          </STMTTRN>
        </OFX>
      `;
      const r = parseOFX(ofx, 'extrato.ofx');
      expect(r.sucesso).toBe(true);
      expect(r.extrato?.conta.banco).toBe('001');
      expect(r.extrato?.conta.agencia).toBe('1234');
      expect(r.extrato?.conta.conta).toBe('56789-0');
    });

    it('extrai transações corretamente', () => {
      const ofx = `
        <OFX>
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20240115120000
            <TRNAMT>5000.00
            <FITID>TX001
            <NAME>Recebimento cliente
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20240116
            <TRNAMT>-200.00
            <FITID>TX002
            <NAME>Pagamento conta
            <MEMO>Energia elétrica
          </STMTTRN>
        </OFX>
      `;
      const r = parseOFX(ofx, 'extrato.ofx');
      expect(r.sucesso).toBe(true);
      expect(r.extrato?.transacoes.length).toBe(2);
      
      const credito = r.extrato?.transacoes.find(t => t.valor > 0);
      expect(credito?.tipo).toBe('credito');
      expect(credito?.valor).toBe(5000);
      
      const debito = r.extrato?.transacoes.find(t => t.valor < 0);
      expect(debito?.tipo).toBe('debito');
      expect(debito?.descricao).toContain('Pagamento');
    });

    it('extrai saldo final', () => {
      const ofx = `
        <OFX>
          <BALAMT>12500.75
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20240115
            <TRNAMT>100
            <FITID>TX001
            <NAME>Test
          </STMTTRN>
        </OFX>
      `;
      const r = parseOFX(ofx, 'test.ofx');
      expect(r.extrato?.conta.saldoFinal).toBe(12500.75);
    });
  });

  // ========================
  // parseCSV
  // ========================
  describe('parseCSV', () => {
    it('arquivo vazio retorna erro', () => {
      const r = parseCSV('', 'test.csv');
      expect(r.sucesso).toBe(false);
    });

    it('apenas header retorna erro', () => {
      const r = parseCSV('data;descricao;valor', 'test.csv');
      expect(r.sucesso).toBe(false);
    });

    it('parse com separador ponto-e-vírgula', () => {
      const csv = `data;descricao;valor
15/01/2024;Pagamento fornecedor;-500,00
16/01/2024;Recebimento cliente;1200,00`;
      const r = parseCSV(csv, 'extrato.csv');
      expect(r.sucesso).toBe(true);
      expect(r.extrato?.transacoes.length).toBe(2);
    });

    it('parse com separador vírgula', () => {
      const csv = `date,description,amount
2024-01-15,Payment,-500
2024-01-16,Receipt,1200`;
      const r = parseCSV(csv, 'extrato.csv');
      expect(r.sucesso).toBe(true);
      expect(r.extrato?.transacoes.length).toBe(2);
    });

    it('identifica crédito e débito por valor', () => {
      const csv = `data;descricao;valor
15/01/2024;Débito;-100
16/01/2024;Crédito;200`;
      const r = parseCSV(csv, 'test.csv');
      const debito = r.extrato?.transacoes.find(t => t.tipo === 'debito');
      const credito = r.extrato?.transacoes.find(t => t.tipo === 'credito');
      expect(debito).toBeTruthy();
      expect(credito).toBeTruthy();
    });

    it('identifica crédito/débito por coluna tipo', () => {
      const csv = `data;descricao;valor;tipo
15/01/2024;Conta luz;100;D
16/01/2024;Venda;200;C`;
      const r = parseCSV(csv, 'test.csv');
      expect(r.extrato?.transacoes.find(t => t.tipo === 'debito')).toBeTruthy();
      expect(r.extrato?.transacoes.find(t => t.tipo === 'credito')).toBeTruthy();
    });

    it('formato é identificado como CSV', () => {
      const csv = `data;valor\n01/01/2024;100`;
      const r = parseCSV(csv, 'test.csv');
      expect(r.extrato?.formato).toBe('CSV');
    });

    it('linhas inválidas geram avisos', () => {
      const csv = `data;descricao;valor
invalido;teste;abc
15/01/2024;ok;100`;
      const r = parseCSV(csv, 'test.csv');
      expect(r.avisos.length).toBeGreaterThan(0);
    });
  });

  // ========================
  // parseExtratoBancario (auto-detect)
  // ========================
  describe('parseExtratoBancario', () => {
    it('detecta OFX pelo conteúdo', () => {
      const content = `OFXHEADER:100\n<OFX><STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20240101<TRNAMT>100<FITID>1<NAME>Test</STMTTRN></OFX>`;
      const r = parseExtratoBancario(content, 'file.txt');
      expect(r.extrato?.formato).toBe('OFX');
    });

    it('detecta CSV pela extensão', () => {
      const content = `data;valor\n01/01/2024;100`;
      const r = parseExtratoBancario(content, 'extrato.csv');
      expect(r.extrato?.formato).toBe('CSV');
    });

    it('formato desconhecido retorna erro', () => {
      const r = parseExtratoBancario('conteúdo aleatório', 'file.xyz');
      // Will try CSV as fallback since it has no commas
      expect(r.sucesso).toBe(false);
    });
  });
});
