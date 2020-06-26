import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IProductWithPrice {
  product_id: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not exists.');
    }

    const productsFromRepository = await this.productsRepository.findAllById(
      products,
    );

    if (productsFromRepository.length !== products.length) {
      throw new AppError('Product not exists.');
    }

    productsFromRepository.forEach(product => {
      const findProd = products.find(prod => prod.id === product.id);
      if (findProd && findProd.quantity > product.quantity) {
        throw new AppError('Product not exists.');
      }
    });

    const productsWithPrice: IProductWithPrice[] = [];
    productsFromRepository.forEach(product => {
      const findProd = products.find(prod => prod.id === product.id);
      if (!findProd) {
        throw new AppError('Product not exists.');
      }
      productsWithPrice.push({
        product_id: product.id,
        price: product.price,
        quantity: findProd.quantity,
      });
    });

    await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create({
      customer,
      products: productsWithPrice,
    });

    return order;
  }
}

export default CreateOrderService;
