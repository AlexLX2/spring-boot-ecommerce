package md.akdev.ecommerce.dto;

import lombok.Data;
import md.akdev.ecommerce.entity.Address;
import md.akdev.ecommerce.entity.Customer;
import md.akdev.ecommerce.entity.Order;
import md.akdev.ecommerce.entity.OrderItem;

import java.util.Set;

@Data
public class Purchase {

    private Customer customer;
    private Address shippingAddress;
    private Address billingAddress;
    private Order order;
    private Set<OrderItem> orderItems;

}
