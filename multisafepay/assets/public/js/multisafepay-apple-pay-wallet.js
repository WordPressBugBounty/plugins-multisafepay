/**
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade the MultiSafepay plugin
 * to newer versions in the future. If you wish to customize the plugin for your
 * needs, please document your changes and make backups before you update.
 *
 * @author      MultiSafepay <integration@multisafepay.com>
 * @copyright   Copyright (c) MultiSafepay, Inc. (https://www.multisafepay.com)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @package     MultiSafepay
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Create a default value for configApplePay if Apple Pay is
 * enabled as redirect automatically
 *
 * @package MultiSafepay Shared Class for Direct Payments
 */
if ( typeof configApplePay === 'undefined' ) {
    configApplePay = { 'debugMode' : null };
}

/**
 * Set a default value in case configAdminUrlAjax is not defined
 */
if ( typeof configAdminUrlAjax === 'undefined' ) {
    configAdminUrlAjax = { 'location' : '/wp-admin/admin-ajax.php' };
}

/**
 * Class for Apple Pay Direct
 */
class ApplePayDirect {
    /**
     * @returns {void}
     */
    constructor() {
        /**
         * Initialize the debug mode if is configured
         */
        this.initializeDebug();
        /**
         * Initialize the configuration of Apple Pay Direct
         */
        this.initializeConfig();

        /**
         * Set the Apple Pay session as inactive as default
         *
         * @type {boolean}
         * @private
         */
        this._sessionActive = false;

        this.init()
            .then(
                () => {
                    debugDirect( 'Apple Pay Direct class initialized', this.debug, 'log' );
                }
            )
            .catch(
                error => {
                    console.error( 'Error initializing Apple Pay Direct:', error );
                }
            );
    }

    /**
     * Initialize the debug mode if configApplePay is defined
     * and the debugMode is enabled
     *
     * @returns {void}
     */
    initializeDebug() {
        this.debug = ( typeof configApplePay !== 'undefined' ) &&
            ( typeof configApplePay.debugMode !== 'undefined' ) &&
            ( configApplePay.debugMode === true );
    }

    /**
     * Initialize configuration and check if configAdminUrlAjax is defined
     *
     * @returns {void}
     */
    initializeConfig() {
        if (
            ( typeof configAdminUrlAjax === 'undefined' ) ||
            ( typeof configAdminUrlAjax.location === 'undefined' )
        ) {
            debugDirect( 'Apple Pay Direct configuration error: configAdminUrlAjax is not properly defined', this.debug );
            return;
        }

        this.config = {
            applePayVersion: 10,
            supportedNetworks: [ 'amex', 'maestro', 'masterCard', 'visa', 'vPay' ],
            merchantCapabilities: [ 'supports3DS' ],
            billingContactFields: [ 'postalAddress', 'name', 'phone', 'email' ],
            shippingContactFields: [ 'postalAddress', 'name', 'phone', 'email' ],
            multiSafepayServerScript: configAdminUrlAjax.location
        };
    }

    /**
     * Initialize Apple Pay Direct
     *
     * @returns {Promise<void>}
     */
    async init()
    {
        try {
            await this.createApplePayButton();
        } catch ( error ) {
            console.error( 'Error creating Apple Pay button:', error );
        }
    }

    /**
     * Check if the session storage feature is available
     *
     * @returns {boolean}
     */
    isSessionStorageAvailable() {
        try {
            const appleStorage = '__appleStorage__';
            sessionStorage.setItem( appleStorage, appleStorage );
            sessionStorage.removeItem( appleStorage );
            return true;
        } catch ( error ) {
            return false;
        }
    }

    /**
     * Store the Apple Pay session status (already active or not)
     * to create a persistent mark even refreshing the checkout page
     *
     * @param value
     * @returns {void}
     */
    setSessionStatus( value ) {
        if ( this.isSessionStorageAvailable() ) {
            sessionStorage.setItem( 'applePaySessionActive', value );
        } else {
            // Use a class property when sessionStorage is not available.
            // Also, useful for Safari in private browsing mode.
            this._sessionActive = value;
        }
    }

    /**
     * Check if the Apple Pay session is active
     *
     * @returns {*|boolean}
     */
    isSessionActive() {
        if ( this.isSessionStorageAvailable() ) {
            return sessionStorage.getItem( 'applePaySessionActive' ) === 'true';
        } else {
            return this._sessionActive;
        }
    }

    /**
     * Event handler for Apple Pay button click
     *
     * @returns {Promise<void>}
     */
    onApplePaymentButtonClicked = async() => {
        try {
            await this.beginApplePaySession();
        } catch ( error ) {
            console.error( 'Error starting Apple Pay session when button is clicked:', error );
            this.setSessionStatus( false );
        }
    }

    /**
     * Create Apple Pay button
     *
     * @returns {Promise<void>}
     */
    async createApplePayButton()
    {
        // Check if previous buttons already exist and remove them
        cleanUpDirectButtons();

        const buttonContainer = document.getElementById( 'place_order' ).parentElement;
        if ( ! buttonContainer ) {
            debugDirect( 'Button container not found', this.debug );
            return;
        }

        // Features of the button
        const buttonTag        = document.createElement( 'button' );
        buttonTag.className    = 'apple-pay-button apple-pay-button-black';
        buttonTag.style.cursor = 'pointer';

        buttonContainer.addEventListener(
            'click',
            (
                event ) => {
                    this.onApplePaymentButtonClicked();
                    // Avoid that WordPress submits the form
                    event.preventDefault();
                }
        );

        // Append the button to the div
        buttonContainer.appendChild( buttonTag );
    }

    /**
     * Create the Apple Pay payment request object and session
     *
     * Some variables from the global scope are launched from
     * the internal code of Prestashop
     *
     * @returns {Promise<void>}
     */
    async beginApplePaySession()
    {
        try {
            const validatorInstance = new FieldsValidator();
            const fieldsAreValid    = validatorInstance.checkFields();
            if ( ! fieldsAreValid ) {
                debugDirect( 'Not all mandatory fields were filled out', this.debug, 'warn' );
                return;
            }

            if ( this.isSessionActive() ) {
                debugDirect( 'Apple Pay session was already activated', this.debug, 'log' );
                return;
            }

            // Create the payment request object
            const paymentRequest = {
                countryCode: configApplePay.countryCode,
                currencyCode: configApplePay.currencyCode,
                merchantCapabilities: this.config.merchantCapabilities,
                supportedNetworks: this.config.supportedNetworks,
                total: {
                    label: configApplePay.merchantName,
                    type: 'final',
                    amount: configApplePay.totalPrice.toFixed( 2 ),
                },
                requiredBillingContactFields: this.config.billingContactFields,
                requiredShippingContactFields: this.config.shippingContactFields
            };

            // Create the session and handle the events
            const session = new ApplePaySession( this.config.applePayVersion, paymentRequest );
            if ( session ) {
                session.onvalidatemerchant  = ( event ) => this.handleValidateMerchant( event, session );
                session.onpaymentauthorized = ( event ) => this.handlePaymentAuthorized( event, session );
                session.oncancel            = ( event ) => this.handleCancel( event, session );
                session.begin();

                this.setSessionStatus( true );
            }
        } catch ( error ) {
            console.error( 'Error starting Apple Pay session:', error );
            this.setSessionStatus( false );
        }
    }

    /**
     * Fetch merchant session data from MultiSafepay
     *
     * @param {string} validationURL
     * @param {string} originDomain
     * @returns {Promise<object>}
     */
    async fetchMerchantSession(validationURL, originDomain)
    {
        const data = new URLSearchParams();
        data.append( 'action', 'applepay_direct_validation' );
        data.append( 'validation_url', validationURL );
        data.append( 'origin_domain', originDomain );

        const response = await fetch(
            this.config.multiSafepayServerScript,
            {
                method: 'POST',
                body: data,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        return JSON.parse( await response.json() );
    }

    /**
     * Validate merchant
     *
     * @param {object} event
     * @param {object} session
     * @returns {Promise<void>}
     */
    handleValidateMerchant = async( event, session ) => {
        try {
            const validationURL = event.validationURL;
            const originDomain  = window.location.hostname;

            const merchantSession = await this.fetchMerchantSession( validationURL, originDomain );
            if ( merchantSession && ( typeof merchantSession === 'object' ) ) {
                session.completeMerchantValidation( merchantSession );
            } else {
                debugDirect( 'Error validating merchant', this.debug );
                session.abort();
            }
        } catch ( error ) {
            console.error( 'Error validating merchant:', error );
            session.abort();
        }

        this.setSessionStatus( false );
    }

    /**
     * Handle payment authorized
     *
     * @param {object} event
     * @param {object} session
     * @returns {Promise<void>}
     */
    handlePaymentAuthorized = async( event, session ) => {
        try {
            const paymentToken = JSON.stringify( event.payment.token );
            const success      = await this.submitApplePayForm( paymentToken );
            if ( success ) {
                session.completePayment( ApplePaySession.STATUS_SUCCESS );
            } else {
                session.completePayment( ApplePaySession.STATUS_FAILURE );
                debugDirect( 'Error processing Apple Pay payment', this.debug );
            }
        } catch ( error ) {
            session.completePayment( ApplePaySession.STATUS_FAILURE );
            console.error( 'Error processing Apple Pay payment:', error );
        }

        this.setSessionStatus( false );
    }

    /**
     * Handle cancellation of the session
     *
     * @returns {void}
     */
    handleCancel( event, session ) {
        if ( ApplePaySession.STATUS_FAILURE === 0 ) {
            try {
                debugDirect( 'Apple Pay Direct session successfully aborted.', this.debug, 'log' );
                session.abort();
            } catch ( error ) {
                console.error( 'Error when aborting Apple Pay Direct session:', error );
            }
        }

        this.setSessionStatus( false );
    }

    /**
     * Submit the Apple Pay form
     *
     * @param {string} paymentToken
     * @returns {Promise<boolean>}
     */
    async submitApplePayForm( paymentToken )
    {
        if ( ( typeof paymentToken !== 'string' ) || ( paymentToken.trim() === '') ) {
            debugDirect( 'Invalid payload provided', this.debug );
            return false;
        }

        const applepayForm = document.querySelector( 'form[name="checkout"]' );

        if ( ! applepayForm ) {
            debugDirect( 'Apple Pay form not found', this.debug );
            return false;
        }

        // Settings the features of the input field
        const inputField = document.createElement( 'input' );
        inputField.type  = 'hidden';
        inputField.name  = 'payment_token';
        inputField.value = paymentToken;

        // Settings the features of the browser field
        const browserField = document.createElement( 'input' );
        browserField.type  = 'hidden';
        browserField.name  = 'browser';
        browserField.value = getCustomerBrowserInfo();

        // Add the hidden field to the form including the token value
        applepayForm.appendChild( inputField );
        // Add the hidden field to the form including the browser info
        applepayForm.appendChild( browserField );
        // Submit the form automatically
        applepayForm.dispatchEvent( new Event( 'submit' ) );
        return true;
    }
}
