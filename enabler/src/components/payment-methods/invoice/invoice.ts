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
  console.log("submit-triggered");
  this.sdk.init({ environment: this.environment });
  console.log("sdk-triggered");
  const paymentAccessKey = 'a87ff679a2f3e71d9181a67b7542122c';
  const apiSignature = '7ibc7ob5|tuJEH3gNbeWJfIHah||nbobljbnmdli0poys|doU3HJVoym7MQ44qf7cpn7pc';
  const tariffId = '10004';
  const endpoint = 'https://payport.novalnet.de/v2/payment';
  console.log("variables-triggered");
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Charset': 'utf-8',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Origin, Charset, Content-Type, Accept, X-NN-Access-Key, Accept',
    'X-NN-Access-Key': btoa(paymentAccessKey)
  };
  console.log("headers-triggered");

  const novalnetPayload = {
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
      payment_type: 'PREPAYMENT',
      amount: 10,
      currency: 'EUR'
    }
  };
console.log("payload-triggered");
  try {
    const novalnetResponse = await fetch(endpoint, {
      mode: 'no-cors',
      method: 'POST',
      headers,
      body: JSON.stringify(novalnetPayload)
    });
    console.log("response-triggered");
    console.log(novalnetResponse);
    const novalnetResult = await novalnetResponse.json();
    console.log("Novalnet response:", novalnetResult);

    const requestData: PaymentRequestSchemaDTO = {
      paymentMethod: {
        type: this.paymentMethod,
      },
      paymentOutcome: PaymentOutcome.AUTHORIZED,
    };

    const backendResponse = await fetch(this.processorUrl + "/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": this.sessionId,
      },
      body: JSON.stringify(requestData),
    });
    const backendResult = await backendResponse.json();
    console.log("Backend response:", backendResult);

    if (backendResult.paymentReference) {
      this.onComplete?.({
        isSuccess: true,
        paymentReference: backendResult.paymentReference,
      });
    } else {
      this.onError("Some error occurred. Please try again.");
    }
  } catch (e) {
    console.log("Error occurred:", e);
    this.onError("Some error occurred. Please try again.");
  } finally {
    console.log("Finally code-triggerred");
  }
  console.log("outside of finally code triggered");
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
