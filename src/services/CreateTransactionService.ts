import { getRepository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const createdCategory = categoriesRepository.create({ title: category });

    const checkCategoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!checkCategoryExists) {
      await categoriesRepository.save(createdCategory);
    }

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.income - value < 0) {
      throw new AppError('You have no money');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: checkCategoryExists
        ? checkCategoryExists.id
        : createdCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
