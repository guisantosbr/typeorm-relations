import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  private ormRepositoryOrdersProducts: Repository<OrdersProducts>;

  constructor() {
    this.ormRepository = getRepository(Order);
    this.ormRepositoryOrdersProducts = getRepository(OrdersProducts);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = this.ormRepository.create({ customer });
    await this.ormRepository.save(order);

    const order_products: OrdersProducts[] = [];
    products.forEach(async product => {
      const ordersProducts = this.ormRepositoryOrdersProducts.create({
        order_id: order.id,
        product_id: product.product_id,
        price: product.price,
        quantity: product.quantity,
      } as OrdersProducts);

      order_products.push(ordersProducts);
    });

    order.order_products = order_products;
    await this.ormRepository.save(order);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository.findOne(id);
    return order;
  }
}

export default OrdersRepository;
