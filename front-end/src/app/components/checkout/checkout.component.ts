import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Luv2ShopFormService} from 'src/app/services/luv2-shop-form.service';
import {Country} from 'src/app/common/country';
import {State} from 'src/app/common/state';
import {AkdevValidators} from "../../validators/akdev-validators";
import {CartService} from "../../services/cart.service";
import {CheckoutService} from "../../services/checkout.service";
import {Router} from "@angular/router";
import {Order} from "../../common/order";
import {OrderItem} from "../../common/order-item";
import {Purchase} from "../../common/purchase";
import {environment} from "../../../environments/environment";
import {PaymentInfo} from "../../common/payment-info";


@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

    isDisabled: boolean = false;

    cardElement: any;
    displayError: any = '';

    checkoutFormGroup: FormGroup;

    totalPrice: number = 0;

    totalQuantity: number = 0;
    creditCardYears: number[] = [];

    creditCardMonths: number[] = [];
    countries: Country[] = [];

    shippingAddressStates: State[] = [];
    billingAddressStates: State[] = [];

    storage: Storage = sessionStorage;

    //init Stripe API
    stripe = Stripe(environment.stripePublishableKey);

    paymentInfo = new PaymentInfo();

    constructor(private formBuilder: FormBuilder,
                private luv2ShopFormService: Luv2ShopFormService,
                private cartService: CartService,
                private checkoutService: CheckoutService,
                private router: Router) {
    }

    get firstName() {
        return this.checkoutFormGroup.get('customer.firstName');
    }

    get lastName() {
        return this.checkoutFormGroup.get('customer.lastName');
    }

    get email() {
        return this.checkoutFormGroup.get('customer.email');
    }

    get shippingAddressStreet() {
        return this.checkoutFormGroup.get('shippingAddress.street');
    }

    get shippingAddressCity() {
        return this.checkoutFormGroup.get('shippingAddress.city');
    }

    get shippingAddressState() {
        return this.checkoutFormGroup.get('shippingAddress.state');
    }

    get shippingAddressZipCode() {
        return this.checkoutFormGroup.get('shippingAddress.zipCode');
    }

    get shippingAddressCountry() {
        return this.checkoutFormGroup.get('shippingAddress.country');
    }

    get billingAddressStreet() {
        return this.checkoutFormGroup.get('billingAddress.street');
    }

    get billingAddressCity() {
        return this.checkoutFormGroup.get('billingAddress.city');
    }

    get billingAddressState() {
        return this.checkoutFormGroup.get('billingAddress.state');
    }

    get billingAddressZipCode() {
        return this.checkoutFormGroup.get('billingAddress.zipCode');
    }

    get billingAddressCountry() {
        return this.checkoutFormGroup.get('billingAddress.country');
    }

    get creditCardType() {
        return this.checkoutFormGroup.get('creditCard.cardType');
    }

    get creditCardNameOnCard() {
        return this.checkoutFormGroup.get('creditCard.nameOnCard');
    }

    get creditCardNumber() {
        return this.checkoutFormGroup.get('creditCard.cardNumber');
    }

    get creditCardSecurityCode() {
        return this.checkoutFormGroup.get('creditCard.securityCode');
    }

    ngOnInit(): void {

        //setup String payment form
        this.setupStripePaymentForm();

        this.reviewCartDetails();

        const userEmail = JSON.parse(this.storage.getItem('userEmail')!);

        this.checkoutFormGroup = this.formBuilder.group({
            customer: this.formBuilder.group({
                firstName: new FormControl('', [Validators.required, Validators.minLength(2), AkdevValidators.notOnlyWhitespace]),
                lastName: new FormControl('', [Validators.required, Validators.minLength(2), AkdevValidators.notOnlyWhitespace]),
                email: new FormControl(userEmail, [Validators.pattern(
                    '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'
                ), Validators.required])
            }),
            shippingAddress: this.formBuilder.group({
                street: new FormControl('', [Validators.required, Validators.minLength(2), AkdevValidators.notOnlyWhitespace]),
                city: new FormControl('', [Validators.required, Validators.minLength(2), AkdevValidators.notOnlyWhitespace]),
                state: new FormControl('', [Validators.required]),
                country: new FormControl('', [Validators.required]),
                zipCode: new FormControl('', [Validators.required, Validators.minLength(2), AkdevValidators.notOnlyWhitespace])
            }),
            billingAddress: this.formBuilder.group({
                street: new FormControl('', [Validators.required, Validators.minLength(2), AkdevValidators.notOnlyWhitespace]),
                city: new FormControl('', [Validators.required, Validators.minLength(2), AkdevValidators.notOnlyWhitespace]),
                state: new FormControl('', [Validators.required]),
                country: new FormControl('', [Validators.required]),
                zipCode: new FormControl('', [Validators.required, Validators.minLength(2), AkdevValidators.notOnlyWhitespace])
            }),
            creditCard: this.formBuilder.group({
            })
        });


        // populate countries
        this.luv2ShopFormService.getCountries().subscribe(
            data => {
                console.log("Retrieved countries: " + JSON.stringify(data));
                this.countries = data;
            }
        );
    }

    copyShippingAddressToBillingAddress(event) {

        if (event.target.checked) {
            this.checkoutFormGroup.controls.billingAddress
                .setValue(this.checkoutFormGroup.controls.shippingAddress.value);
        } else {
            this.checkoutFormGroup.controls.billingAddress.reset();
        }

    }

    onSubmit() {
        console.log("Handling the submit button");

        if (this.checkoutFormGroup.invalid) {
            this.checkoutFormGroup.markAllAsTouched();
            return;
        }

        let order = new Order();
        order.totalPrice = this.totalPrice;
        order.totalQuantity = this.totalQuantity;

        const cartItems = this.cartService.cartItems;

        let orderItems: OrderItem[] = cartItems
            .map(tempCartItem => new OrderItem(tempCartItem));

        let purchase: Purchase = new Purchase();

        purchase.customer = this.checkoutFormGroup.controls['customer'].value;

        purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
        const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress.state))
        const shippingCountry: Country = JSON.parse(JSON.stringify(purchase.shippingAddress.country))
        purchase.shippingAddress.state = shippingState.name;
        purchase.shippingAddress.country = shippingCountry.name;

        purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
        const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state))
        const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress.country))
        purchase.billingAddress.state = billingState.name;
        purchase.billingAddress.country = billingCountry.name;

        purchase.order = order;
        purchase.orderItems = orderItems;

        this.paymentInfo.amount = Math.round(this.totalPrice * 100);
        this.paymentInfo.currency = 'USD';
        this.paymentInfo.receiptEmail = purchase.customer.email;

        if (!this.checkoutFormGroup.invalid && this.displayError.textContent === "") {
            this.isDisabled = true;
            this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe(
                (paymentIntentResponse) => {
                    this.stripe.confirmCardPayment(paymentIntentResponse.client_secret,
                        {
                            payment_method: {
                                card: this.cardElement,
                                billing_details: {
                                    email: purchase.customer.email,
                                    name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                                    address: {
                                        line1: purchase.billingAddress.street,
                                        city: purchase.billingAddress.city,
                                        state: purchase.billingAddress.state,
                                        postal_code: purchase.billingAddress.zipCode,
                                        country: this.billingAddressCountry.value.code
                                    }
                                }
                            }
                        }, {handleActions: false}
                    ).then((result: any) => {
                        if (result.error) {
                            alert(`There was an error: ${result.error.message}`);
                            this.isDisabled = false;
                        } else {
                            this.checkoutService.placeOrder(purchase).subscribe({
                                    next: (response: any) => {
                                        alert(`Your order has been receiver. \nOrder tracking number: ${response.orderTrackingnumber}`);
                                        this.resetCart();
                                        this.isDisabled = false;
                                    },
                                    error: (err: any) => {
                                        alert(`There was an error: ${err.message}`);
                                        this.isDisabled = false;
                                    }
                                }
                            )
                        }
                    }).bind(this);
                });
        } else {
            this.checkoutFormGroup.markAllAsTouched();
            return;
        }

    }

    handleMonthsAndYears() {

        const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');

        const currentYear: number = new Date().getFullYear();
        const selectedYear: number = Number(creditCardFormGroup.value.expirationYear);

        // if the current year equals the selected year, then start with the current month

        let startMonth: number;

        if (currentYear === selectedYear) {
            startMonth = new Date().getMonth() + 1;
        } else {
            startMonth = 1;
        }

        this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
            data => {
                console.log("Retrieved credit card months: " + JSON.stringify(data));
                this.creditCardMonths = data;
            }
        );
    }

    getStates(formGroupName: string) {

        const formGroup = this.checkoutFormGroup.get(formGroupName);

        const countryCode = formGroup.value.country.code;
        const countryName = formGroup.value.country.name;

        console.log(`${formGroupName} country code: ${countryCode}`);
        console.log(`${formGroupName} country name: ${countryName}`);

        this.luv2ShopFormService.getStates(countryCode).subscribe(
            data => {

                if (formGroupName === 'shippingAddress') {
                    this.shippingAddressStates = data;
                } else {
                    this.billingAddressStates = data;
                }

                // select first item by default
                formGroup.get('state').setValue(data[0]);
            }
        );
    }

    private reviewCartDetails() {
        this.cartService.totalQuantity.subscribe(tqty => {
            this.totalQuantity = tqty;
        })

        this.cartService.totalPrice.subscribe(tpr => {
            this.totalPrice = tpr;
        })
    }

    private resetCart() {
        this.cartService.cartItems = [];
        this.cartService.totalPrice.next(0);
        this.cartService.totalQuantity.next(0);

        this.checkoutFormGroup.reset();
        this.cartService.persistCartItems();

        this.router.navigateByUrl("/products");
    }

    private setupStripePaymentForm() {
        let elements = this.stripe.elements();

        this.cardElement = elements.create('card', {hidePostalCode: true});

        this.cardElement.mount('#card-element');

        this.cardElement.on('change', (event: any) => {
            this.displayError = document.getElementById('card-errors');
            if (event.complete) {
                this.displayError.textContent = '';
            } else if (event.error) {
                this.displayError.textContent = event.error.message;
            }
        });
    }
}
