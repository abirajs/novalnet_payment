import {
  ComponentOptions,
  PaymentComponent,
  PaymentComponentBuilder,
  PaymentMethod
} from '../../../payment-enabler/payment-enabler';
import { BaseComponent } from "../../base";
import styles from '../../../style/style.module.scss';
import buttonStyles from "../../../style/button.module.scss";
import {
  PaymentOutcome,
  PaymentRequestSchemaDTO,
} from "../../../dtos/mock-payment.dto";
import { BaseOptions } from "../../../payment-enabler/payment-enabler-mock";

export class InvoiceBuilder implements PaymentComponentBuilder {
  public componentHasSubmit = true;
  constructor(private baseOptions: BaseOptions) {}

  build(config: ComponentOptions): PaymentComponent {
    return new Invoice(this.baseOptions, config);
  }
}

export class Invoice extends BaseComponent {
  private showPayButton: boolean;

  constructor(baseOptions: BaseOptions, componentOptions: ComponentOptions) {
    super(PaymentMethod.invoice, baseOptions, componentOptions);
    this.showPayButton = componentOptions?.showPayButton ?? false;
  }

  mount(selector: string) {
    document
      .querySelector(selector)
      .insertAdjacentHTML("afterbegin", this._getTemplate());

    if (this.showPayButton) {
      document
        .querySelector("#invoiceForm-paymentButton")
        .addEventListener("click", (e) => {
          e.preventDefault();
          this.submit();
        });
    }
  }

async submit() {
  this.sdk.init({ environment: this.environment });

  const paymentAccessKey = 'a87ff679a2f3e71d9181a67b7542122c';
  const apiSignature = '7ibc7ob5|tuJEH3gNbeWJfIHah||nbobljbnmdli0poys|doU3HJVoym7MQ44qf7cpn7pc';
  const tariffId = '10004';

  const endpoint = 'https://payport.novalnet.de/v2/payment';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Charset': 'utf-8',
    'Accept': 'application/json',
    'X-NN-Access-Key': btoa(paymentAccessKey)
  };

  const data = {
    merchant: {
      signature: apiSignature,
      tariff: tariffId
    },
    customer: {
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'test@novalnet.de',
      billing: {
        company: 'ABC GmbH',
        house_no: '2',
        street: 'Musterstr',
        city: 'Musterhausen',
        zip: '12345',
        country_code: 'DE',
        state: 'Berlin'
      },
    },
    transaction: {
      test_mode: '1',
      payment_type: 'PREPAYMENT', // Use dynamic method
      amount: '10',
      currency: 'EUR'
    }
  };
console.log(data);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
console.log(response);
    const result = await response.json();
console.log(result);
    if (!response.ok || !result.transaction?.tid) {
      throw new Error(result.error?.message || 'Payment request failed');
    }

    // Call onComplete with success and transaction ID
    this.onComplete &&
      this.onComplete({
        isSuccess: true,
        paymentReference: result.transaction.tid,
      });
  } catch (error) {
    console.error('Request error:', error);
    this.onError("Some error occurred. Please try again.");
  }
}


  private _getTemplate() {
    return this.showPayButton
      ? `
    <div class="${styles.wrapper}">
      <p>Pay easily with Invoice and transfer the shopping amount within the specified date.</p>
      <button class="${buttonStyles.button} ${buttonStyles.fullWidth} ${styles.submitButton}" id="invoiceForm-paymentButton">Pay</button>
    </div>
    `
      : "";
  }
}
