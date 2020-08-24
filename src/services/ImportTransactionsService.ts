import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';

import CreateTransaction from './CreateTransactionService';

import Transaction from '../models/Transaction';

import uploadConfig from '../config/upload';

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, filename);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: string[] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactions = lines.map(line => {
      return {
        title: line[0],
        type: line[1] as 'income' | 'outcome',
        value: Number(line[2]),
        category: line[3],
      };
    });

    const createTransaction = new CreateTransaction();

    const createdTransactions = transactions.map(async transaction => {
      const createdTransaction = await createTransaction.execute(transaction);

      return createdTransaction;
    });

    return Promise.all(createdTransactions);
  }
}

export default ImportTransactionsService;
