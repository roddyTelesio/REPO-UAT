/**
 * @description       : 
**/
import {LightningElement, track, wire, api} from 'lwc';import {refreshApex} from '@salesforce/apex';import {registerListener, fireEvent} from 'c/pubSub';import {NavigationMixin, CurrentPageReference } from 'lightning/navigation';import {getObjectInfo } from 'lightning/uiObjectInfoApi';import {getPicklistValues} from 'lightning/uiObjectInfoApi';import {ShowToastEvent} from 'lightning/platformShowToastEvent';import closePreviousPhase from '@salesforce/apex/LWC30_SigningRequests.closePreviousPhase';import getSigningDetails from '@salesforce/apex/LWC30_SigningRequests.getSigningDetails';import getRequestResult from '@salesforce/apex/LWC30_SigningRequests.lstRequestResult';import getListIdOrginalRequestNotNull from '@salesforce/apex/LWC30_SigningRequests.getListIdOrginalRequestNotNull';import getListIdRequest from '@salesforce/apex/LWC30_SigningRequests.getListIdRequest';import updateSigningReqClosePrevPhase from '@salesforce/apex/LWC30_SigningRequests.updateSigningReqClosePrevPhase';import saveSigningRequest from '@salesforce/apex/LWC30_SigningRequests.saveSigningRequest';import updateWrittenSignedShare from '@salesforce/apex/LWC30_SigningRequests.updateWrittenSignedShare';import deleteSigningRequests from '@salesforce/apex/AP43_DeleteClonedRequests.deleteSigningRequests';import closeSigningNotifyWebXL from '@salesforce/apex/LWC30_SigningRequests.closeSigningNotifyWebXL';import reopenSigningRequest from '@salesforce/apex/LWC30_SigningRequests.reopenSigningRequest';import reopenPreviousPhase from '@salesforce/apex/LWC30_SigningRequests.reopenPreviousPhase';import getLookupAccountField from '@salesforce/apex/LWC30_SigningRequests.getLookupAccountField';import checkIfProgPhaseSigningHasDoc from '@salesforce/apex/LWC30_SigningRequests.checkIfProgPhaseSigningHasDoc';import checkIfLeadReqAreAnswered from '@salesforce/apex/LWC30_SigningRequests.checkIfLeadReqAreAnswered';import checkFXRATEifExists from '@salesforce/apex/LWC30_SigningRequests.checkFXRATEifExists';import BROKER_STATUS_FIELD from '@salesforce/schema/Request__c.BrokerStatus__c';import LOSS_DEPOSIT_MODE_FIELD from '@salesforce/schema/Request__c.LossDepositMode__c';import PREMIUM_DEPOSIT_FIELD from '@salesforce/schema/Request__c.PremiumDeposit__c';import REQUEST_OBJECT from '@salesforce/schema/Request__c';import getAgreements from '@salesforce/apex/LWC30_SigningRequests.getListAgreementIds';

//import custom labels
import signingReqSaved from '@salesforce/label/c.signingReqSaved';
import FormEntriesInvalid from '@salesforce/label/c.FormEntriesInvalid';
import phasesClosed from '@salesforce/label/c.phasesClosed';
import NoChanges from '@salesforce/label/c.NoChanges';
import NoRequest from '@salesforce/label/c.NoRequest';
import emailSent from '@salesforce/label/c.emailSent';
import requestSelected from '@salesforce/label/c.requestSelected';
import writtenShare from '@salesforce/label/c.writtenShare';
import requestDeleted from '@salesforce/label/c.requestDeleted';
import requestReopened from '@salesforce/label/c.requestReopened';
import SomeQuoteRequestAssociatedCancelTreatySection from '@salesforce/label/c.SomeQuoteRequestAssociatedCancelTreatySection';//RRA - ticket 585 - 16032023
import askValidationImpossible from '@salesforce/label/c.askValidationImpossible';

import NoSigningRequestSetupPresent from '@salesforce/label/c.NoSigningRequestSetupPresent';
import SigningRequestNoFXRate from '@salesforce/label/c.SigningRequestNoFXRate';
import SigningRequestNoSignedShare from '@salesforce/label/c.SigningRequestNoSignedShare';
import Premium_exceeds_authorization_for_signing from '@salesforce/label/c.Premium_exceeds_authorization_for_signing';
import SignedShareNotMatchingPlacementS from '@salesforce/label/c.SignedShareNotMatchingPlacementS';
import NoContractualDocumentAttached from '@salesforce/label/c.NoContractualDocumentAttached';
import NoSigningRequestSelected from '@salesforce/label/c.NoSigningRequestSelected';
import SigningRequestStatusSetup from '@salesforce/label/c.SigningRequestStatusSetup';
import NoSigningRequest_ReinsurerStatus_Sent_or_Timeout from '@salesforce/label/c.NoSigningRequest_ReinsurerStatus_Sent_or_Timeout';
import CannotRemind_RequestNotSent from '@salesforce/label/c.CannotRemind_RequestNotSent';
import NoNeedToAskForValidation from '@salesforce/label/c.NoNeedToAskForValidation';
import CloseSigningErrorMsg from '@salesforce/label/c.CloseSigningErrorMsg';
import errorMsg from '@salesforce/label/c.errorMsg';

export default class LWC30_SigningRequests extends NavigationMixin(LightningElement) {
    label = {
        signingReqSaved,FormEntriesInvalid,phasesClosed,NoChanges,NoRequest,emailSent,requestSelected,writtenShare,requestDeleted,requestReopened,
        NoSigningRequestSetupPresent,SigningRequestNoFXRate,SigningRequestNoSignedShare,Premium_exceeds_authorization_for_signing,SignedShareNotMatchingPlacementS,
        NoContractualDocumentAttached,NoSigningRequestSelected,SigningRequestStatusSetup,NoSigningRequest_ReinsurerStatus_Sent_or_Timeout,CannotRemind_RequestNotSent,
        NoNeedToAskForValidation,CloseSigningErrorMsg,errorMsg,SomeQuoteRequestAssociatedCancelTreatySection,askValidationImpossible//RRA - ticket 01411 - 03042023
    }
    @api hideCheckbox = false ;
    @api selectedTreaty = null;
    @api selectedBroker = null;
    @api selectedReinsurer = null;
    @api selectedReinsurerStatus = null;
    @api selectedProgram;
    @api uwYear;
    @api principalCedYear;
    @api allReadOnly = false;
    @track dataSigningRequest = [];
    @api lstReqIdEv; 
    //RRA - ticket BUG Marouane sur SignedShare - 13012023
    @track dataSigningRequestClosePreviousPhase = [];
    @track lstSelectedSigningRequest = [];
    @track lstSelectedSigningReqId = [];
    @track brokerStatusOpt = [];
    @track riskCarrierOpt = [];
    @track financialEntityOpt = [];
    @track lossDepositModeOpt = [];
    @track premiumDepositOpt = [];
    @track dataSigningPool = [];
    @track requestsSetup = [];
    @track disableThisButton =false;
    lstSelectedSigningRequest1;
    titleCountSigningRequest = 'Signing Requests (0)';
    isValueChange = false;
    setIdReq = new Set();
    lstReqId = [];
    lstIdReqOnChangeLossDeposit = []; //RRA - Ticket 1866 - 11012023
    //RRA - ticket 1397 - 09012023
    lstIdReqOnChange = [];
    lstIdReqOnChangeSetup = [];  //RRA - ticket 1421 - 08092023
    lstReqIdFinEnt = [];
    lstReqIdFinEntSetup  = []; //RRA - ticket 1421 - 08092023
    lstReqIdRiskCarr = [];
    lstReqIdRiskCarrSetup = []; //RRA - ticket 1421 - 08092023
    lossDepositModeGlob; //RRA - ticket 1421 - 11092023
    lossDepositGlob;//RRA - ticket 1421 - 13092023
    isOpenConfirmation = false;
    programStageValueChange;
    isPhaseChange = false;
    spinnerSigningRequest = false;
    valueUWYear;
    buttonNameClick;
    reqId;
    disableBtnSigning; 
    hideWrittenToSignBtn = false; //RRA - ticket 585 - 07032023
    btnNameSendUpdateRemind;
    valuePrincipalCedComp;
    pcc;
    uwry;
    buttonSignPoolVisibility;
    isSave = false;
    isWrite = false;
    isValidate = false;
    isClose = false;
    isDelete = false;
    isReopen = false;
    isSign = false;
    isAskToSave = false;
    disableReopenPreviousPhase = false;
    isOpenSignForPoolModal = false;
    buttonDeleteVisbility;
    isProfileSuper = false;
    disableBtnSend;
    isSendUpdateRemindSigningReqOpenModal = false;
    titlePopUp;
    showClosePreviousPhaseBtn = false;
    disableUpdateRemind = true;
    marketSubVisible = false;
    totalCededPremiumEUR = 0;
    totalCededPremiumOther = 0;
    displayTwoFieldForPremium = false;
    selectedRequest;
    strPremiumOtherCurrencyLabel = '';
    allowAskForValidation = false;
    contractualDocSigningPresent = false;
    txtRiskCarrierLookupClassName = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    txtFinancialEntityLookupClassName = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    error;
    disabledCloseButton = false;
    closePreviousBtnClick = false;
	isRenderCallbackActionExecuted = false;

    CLM
    @track idAgreements = ''; 
    @api runSubflowsCLM = false;


//AMI 01/06/22: W-0940
    //private attribute to count number of request in setup mode
    //nbrSetupReq = 0;
    isSetupRequest = false ; //MRA 14/07/2022 : W-0940
    searchRiskCarrierLookUpField(event){
        let currentText = event.target.value;
        let eventId = event.target.id;
        let reqId = eventId.split('-')[0];
        let selectedReinsurer;

        getLookupAccountField({value: currentText, requestId : reqId, lookupName: 'RiskCarrier'})
        .then(result => {
            this.txtRiskCarrierLookupClassName =  result.length > 0 ? 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' : 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
            let lstUpdDataSigningRequest = [];
            let lossDepositLevel;
            let lossDeposit;

            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                
                //RRA - ticket 1759 - 20112023
                if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                    lossDepositLevel = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
                }
                
                if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                    lossDeposit = this.dataSigningRequest[0].Program__r.LossDeposit__c;
                }
            
                if(rowReq.Id === reqId){
                    rowReq['loadingTextRisk'] = false;
                    rowReq['searchLookupRecordsRisk'] = result;
                    rowReq['displayRiskCarrierInfo'] = true;
                    rowReq['RiskCarrierName'] = null;
                    selectedReinsurer = rowReq['Reinsurer__c'];

                    if(currentText.length > 0 && result.length == 0) {
                        rowReq['messageFlagRisk'] = true;
                    }
                    else {
                        rowReq['messageFlagRisk'] = false;
                    }
                }
                else{
                    rowReq['displayRiskCarrierInfo'] = false;
                }
              lstUpdDataSigningRequest.push(rowReq);
            }
            if(currentText.length == 0){
                lstUpdDataSigningRequest = [];
                for(let i = 0; i < this.dataSigningRequest.length; i++){
                    let rowReq = { ...this.dataSigningRequest[i] };
                    if(rowReq['Reinsurer__c'] == selectedReinsurer){
                        rowReq['RiskCarrier__c'] = null;
                        rowReq['RiskCarrierName'] = null;
                    }
                    lstUpdDataSigningRequest.push(rowReq);
                }
            }
            //RRA - ticket 1759 - 20112023
            getListIdOrginalRequestNotNull({programId : this.selectedProgram, pcc : this.pcc, uwy : this.uwry, reinsurer : selectedReinsurer})
            .then(result => {
                console.log ('result RiskCarrier 11== ', result);
               if(result.isLossDepositModeTreatySetup){
                   if (result.lstOrigReqNull.includes(reqId)){
                   this.lstReqIdRiskCarrSetup.push(reqId);
                   let removeDuplication = this.lstReqIdRiskCarrSetup.filter((item,index) => this.lstReqIdRiskCarrSetup.indexOf(item) === index);
                   this.lstReqIdRiskCarrSetup = removeDuplication;
                   }
               }else{
                   if (lossDeposit == '1'){
                       if (lossDepositLevel == 'Program'){
                           this.lstReqIdRiskCarr.push(result.lstOrigReqNotNull);
                        }else if (lossDepositLevel == 'Treaty'){
                           this.lstReqIdRiskCarr.push(reqId);
                           let removeDuplication = this.lstReqIdRiskCarr.filter((item,index) => this.lstReqIdRiskCarr.indexOf(item) === index);
                           this.lstReqIdRiskCarr = removeDuplication;
                        }
                   }else if (lossDeposit == '2'){
                       this.lstReqIdRiskCarr.push(reqId);
                       let removeDuplication = this.lstReqIdRiskCarr.filter((item,index) => this.lstReqIdRiskCarr.indexOf(item) === index);
                       this.lstReqIdRiskCarr = removeDuplication;
                   }
                  
               }
            })
            .catch(error => {
                this.error = error;
            });

            this.dataSigningRequest = lstUpdDataSigningRequest;
            this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
        })
        .catch(error => {
            this.error = error;
        });
    }

    setSelectedRiskCarrierLookupRecord(event) {
        let recId = event.currentTarget.dataset.id;
        let selectName = event.currentTarget.dataset.name;
        let reqId = event.currentTarget.title;
        let selectedReinsurerId;
        this.txtRiskCarrierLookupClassName = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
        let lstUpdDataSigningRequest = [];
        let lossDepositLevel;
        let lossDeposit;

        for(let i = 0; i < this.dataSigningRequest.length; i++){
            let rowReq = { ...this.dataSigningRequest[i] };
            
            //RRA - ticket 1759 - 20112023
            if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                lossDepositLevel = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
            }
            
            if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                lossDeposit = this.dataSigningRequest[0].Program__r.LossDeposit__c;
            }
            
            if(rowReq.Id == reqId){
                this.isValueChange = true;
                rowReq['RiskCarrier__c'] = recId;
                rowReq['RiskCarrierName'] = selectName;
                //RRA - ticket 1397 - 09012023
                selectedReinsurerId = rowReq['Reinsurer__c'];
            }
            lstUpdDataSigningRequest.push(rowReq);
        }
        //RRA - ticket 1759 - 20112023
        getListIdOrginalRequestNotNull({programId : this.selectedProgram, pcc : this.pcc, uwy : this.uwry, reinsurer : selectedReinsurerId})
        .then(result => {
            console.log('result riskCarrier 22 == ', result);
           if(result.isLossDepositModeTreatySetup){
               if (result.lstOrigReqNull.includes(reqId)){
               this.lstReqIdRiskCarrSetup.push(reqId);
               let removeDuplication = this.lstReqIdRiskCarrSetup.filter((item,index) => this.lstReqIdRiskCarrSetup.indexOf(item) === index);
               this.lstReqIdRiskCarrSetup = removeDuplication;
               }
           }else{
               if (lossDeposit == '1'){
                   if (lossDepositLevel == 'Program'){
                       this.lstReqIdRiskCarr.push(result.lstOrigReqNotNull);
                    }else if (lossDepositLevel == 'Treaty'){
                       this.lstReqIdRiskCarr.push(reqId);
                       let removeDuplication = this.lstReqIdRiskCarr.filter((item,index) => this.lstReqIdRiskCarr.indexOf(item) === index);
                       this.lstReqIdRiskCarr = removeDuplication;
                    }
               }else if (lossDeposit == '2'){
                   this.lstReqIdRiskCarr.push(reqId);
                   let removeDuplication = this.lstReqIdRiskCarr.filter((item,index) => this.lstReqIdRiskCarr.indexOf(item) === index);
                   this.lstReqIdRiskCarr = removeDuplication;
               }
           }
        })
        .catch(error => {
            this.error = error;
        });

        if(selectedReinsurerId != null){
            lstUpdDataSigningRequest = [];
            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                if(rowReq['Reinsurer__c'] == selectedReinsurerId){
                    rowReq['RiskCarrier__c'] = recId;
                    rowReq['RiskCarrierName'] = selectName;
                }
                lstUpdDataSigningRequest.push(rowReq);
            }
        }

        this.dataSigningRequest = lstUpdDataSigningRequest;
        this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
    }

    searchFinancialEntityLookUpField(event){
        let currentText = event.target.value;
        let eventId = event.target.id;
        let reqId = eventId.split('-')[0];
        let lossDepositLevel;
        let lossDeposit;

        getLookupAccountField({value: currentText, requestId : reqId, lookupName: 'FinancialEntity'})
        .then(result => {
            this.txtFinancialEntityLookupClassName =  result.length > 0 ? 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' : 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
            let lstUpdDataSigningRequest = [];
            let selectedReinsurer;
            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                
                //RRA - ticket 1759 - 20112023
                if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                    lossDepositLevel = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
                }
                
                if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                    lossDeposit = this.dataSigningRequest[0].Program__r.LossDeposit__c;
                }
            
                if(rowReq.Id == reqId){
                    rowReq['loadingTextFinancial'] = false;
                    rowReq['searchLookupRecordsFinancial'] = result;
                    rowReq['displayFinancialInfo'] = true;
                    rowReq['FinancialName'] = null;
                    selectedReinsurer = rowReq['Reinsurer__c'];

                    if(currentText.length > 0 && result.length == 0) {
                        rowReq['messageFlagFinancial'] = true;
                    }
                    else {
                        rowReq['messageFlagFinancial'] = false;
                    }
                }
                else{
                    rowReq['displayFinancialInfo'] = false;
                }

                lstUpdDataSigningRequest.push(rowReq);
            }
            //RRA - ticket 1759 - 20112023
            getListIdOrginalRequestNotNull({programId : this.selectedProgram, pcc : this.pcc, uwy : this.uwry, reinsurer : selectedReinsurer})
            .then(result => {
                console.log('result 11 FinancialEntity == ', result);
            if(result.isLossDepositModeTreatySetup){
                if (result.lstOrigReqNull.includes(reqId)){
                this.lstReqIdFinEntSetup.push(reqId);
                let removeDuplication = this.lstReqIdFinEntSetup.filter((item,index) => this.lstReqIdFinEntSetup.indexOf(item) === index);
                this.lstReqIdFinEntSetup = removeDuplication;
                }
            }else{
                if (lossDeposit == '1'){
                    if (lossDepositLevel == 'Program'){
                        this.lstReqIdFinEnt.push(result.lstOrigReqNotNull);
                        }else if (lossDepositLevel == 'Treaty'){
                        this.lstReqIdFinEnt.push(reqId);
                        let removeDuplication = this.lstReqIdFinEnt.filter((item,index) => this.lstReqIdFinEnt.indexOf(item) === index);
                        this.lstReqIdFinEnt = removeDuplication;
                        }
                }else if (lossDeposit == '2'){
                    this.lstReqIdFinEnt.push(reqId);
                    let removeDuplication = this.lstReqIdFinEnt.filter((item,index) => this.lstReqIdFinEnt.indexOf(item) === index);
                    this.lstReqIdFinEnt = removeDuplication;
                }
                
            }
            })
            .catch(error => {
                this.error = error;
            });

                //SAU
                if(currentText.length == 0){
                    lstUpdDataSigningRequest = [];
                    for(let i = 0; i < this.dataSigningRequest.length; i++){
                        let rowReq = { ...this.dataSigningRequest[i] };
                        if(rowReq['Reinsurer__c'] == selectedReinsurer){
                            rowReq['FinancialEntity__c'] = null;
                            rowReq['FinancialName'] = null;
                        }
                        lstUpdDataSigningRequest.push(rowReq);
                    }
                }

                this.dataSigningRequest = lstUpdDataSigningRequest;
                this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
        })
        .catch(error => {
            this.error = error;
        });
    }

    setSelectedFinancialEntityLookupRecord(event) {
        let recId = event.currentTarget.dataset.id;
        let selectName = event.currentTarget.dataset.name;
        let reqId = event.currentTarget.title;
        let selectedReinsurerId;
        let lossDepositLevel;
        let lossDeposit;

        this.txtFinancialEntityLookupClassName = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
        let lstUpdDataSigningRequest = [];

        for(let i = 0; i < this.dataSigningRequest.length; i++){
            let rowReq = { ...this.dataSigningRequest[i] };
            
            //RRA - ticket 1759 - 20112023
            if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                lossDepositLevel = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
            }
            
            if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                lossDeposit = this.dataSigningRequest[0].Program__r.LossDeposit__c;
            }
            
            if(rowReq.Id == reqId){
                this.isValueChange = true;
                rowReq['FinancialEntity__c'] = recId;
                rowReq['FinancialName'] = selectName;

                //RRA - ticket 1397 - 09012023
                selectedReinsurerId = rowReq['Reinsurer__c'];
            }
            lstUpdDataSigningRequest.push(rowReq);
        }

        //RRA - ticket 1759 - 20112023
        getListIdOrginalRequestNotNull({programId : this.selectedProgram, pcc : this.pcc, uwy : this.uwry, reinsurer : selectedReinsurerId})
        .then(result => {
            console.log('result 22 FinancialEntity == ', result);
        if(result.isLossDepositModeTreatySetup){
            if (result.lstOrigReqNull.includes(reqId)){
            this.lstReqIdFinEntSetup.push(reqId);
            let removeDuplication = this.lstReqIdFinEntSetup.filter((item,index) => this.lstReqIdFinEntSetup.indexOf(item) === index);
            this.lstReqIdFinEntSetup = removeDuplication;
            }
        }else{
            if (lossDeposit == '1'){
                if (lossDepositLevel == 'Program'){
                    this.lstReqIdFinEnt.push(result.lstOrigReqNotNull);
                    }else if (lossDepositLevel == 'Treaty'){
                    this.lstReqIdFinEnt.push(reqId);
                    let removeDuplication = this.lstReqIdFinEnt.filter((item,index) => this.lstReqIdFinEnt.indexOf(item) === index);
                    this.lstReqIdFinEnt = removeDuplication;
                    }
            }else if (lossDeposit == '2'){
                this.lstReqIdFinEnt.push(reqId);
                let removeDuplication = this.lstReqIdFinEnt.filter((item,index) => this.lstReqIdFinEnt.indexOf(item) === index);
                this.lstReqIdFinEnt = removeDuplication;
            }
            
        }
        })
        .catch(error => {
            this.error = error;
        });

        if(selectedReinsurerId != null){
            lstUpdDataSigningRequest = [];
            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                if(rowReq['Reinsurer__c'] == selectedReinsurerId){
                    rowReq['FinancialEntity__c'] = recId;
                    rowReq['FinancialName'] = selectName;
                }
                lstUpdDataSigningRequest.push(rowReq);
            }
        }

        this.dataSigningRequest = [ ...lstUpdDataSigningRequest];
        this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
    }

    @wire(getObjectInfo, { objectApiName: REQUEST_OBJECT })
    objectInfo;

    @wire(CurrentPageReference) pageRef;
    connectedCallback(){
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
        registerListener('stageSigningChange', this.askSaveConfirmation, this);
        registerListener('closeSendUpdateRemindReqModal', this.closeSendUpdateRemindReqModal, this);
        registerListener('updateRequestReinsurer', this.updateRequestReinsurer, this);
        registerListener('refreshSigningData', this.refreshSigningData, this);

        let param = 'c__program';
        let paramValue = null;
        let url = this.pageRef.state;

        if(url != undefined && url != null){
            paramValue = url[param];
        }

        if(paramValue != null){
            let parameters = paramValue.split("-");
            this.valueUWYear = parameters[1];
            this.valuePrincipalCedComp = parameters[2];

            if(parameters[4] != 'null' && parameters[4] != 'undefined'){
                this.valueTreaty = parameters[4];
                this.selectedTreaty = parameters[4];
            }
            if(parameters[5] != 'null' && parameters[5] != 'undefined'){
                this.selectedBroker = parameters[5];
            }
            if(parameters[6] != 'null' && parameters[6] != 'undefined'){
                this.selectedReinsurer = parameters[6];
            }
            if(parameters[7] != 'null' && parameters[7] != 'undefined'){
                this.selectedReinsurerStatus = parameters[7];
            }
        }

        registerListener('closeModal', this.handleCloseConfirmationModal, this);
        registerListener('year', this.getVal, this);
        registerListener('compChange', this.getCompChangePcc, this); 
        registerListener('yearChange', this.getCompChangeuwY, this);
        registerListener('comp', this.getComp, this);
        registerListener('valueTreaty', this.getValueTreaty, this);
        registerListener('valueBroker', this.getValueBroker, this);
        registerListener('valueReinsurer', this.getValueReinsurer, this);
        registerListener('valueReinsurerStatus', this.getValueReinsurerStatus, this);
        registerListener('valueProgram', this.getValueProgram, this);
        registerListener('closeMarketSubModal', this.handleCloseMarketSubModal, this);

        // RRA - Get pcc from onChange pcc on working scope
        if (this.pcc == undefined){
        this.pcc = this.valuePrincipalCedComp
        }else{
            this.pcc =  this.pcc;
        }

        // RRA - Get uwy from onChange uwy on working scope
        if ( this.uwry == undefined){
            this.uwry = this.uwYear
        }else{
            this.uwry =  this.uwry;
        }
    }

	renderedCallback() {
        if (this.isRenderCallbackActionExecuted){
            return;
        }

        this.isRenderCallbackActionExecuted = true;
        const style = document.createElement('style');
        style.innerText = '.strongText input {font-weight: bold!important;}';
    
        this.template.querySelectorAll('[data-table-id="1"],tr[data-id="trId"],td[data-id="tdId"],div[data-id="divId"],lightning-combobox,div,lightning-base-combobox,div,div,input').forEach (function (node) {
            node.appendChild(style);
        });
    }
    refreshSigningData(val){
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    getUrlParamValue(url, key) {
        return new URL(url).searchParams.get(key);
    }

    getVal(val){
        this.valueUWYear = val;
        this.selectedProgram = null;
        this.selectedTreaty = null;
        this.selectedReinsurer = null;
        this.selectedBroker = null;
        this.selectedReinsurerStatus = null;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

     // RRA - optimization
     getCompChangePcc(val){
        this.pcc = val;
        this.selectedProgram = null;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    // RRA - optimization
    getCompChangeuwY(val){
        this.uwry = val;
        this.selectedProgram = null;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    getComp(val){
        this.valuePrincipalCedComp = val;
        this.selectedProgram = null;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    getValueProgram(val){
        this.selectedProgram = val;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    getValueTreaty(val){
        this.selectedTreaty = val;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    getValueReinsurer(val){
        this.selectedReinsurer = val;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    getValueBroker(val){
        this.selectedBroker = val;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    getValueReinsurerStatus(val){
        this.selectedReinsurerStatus = val;
        this.spinnerSigningRequest = true;
        this.getSigningDetails();
    }

    handleClosePreviousPhases(){
        //RRA - ticket 585 - 15032023
            this.spinnerSigningRequest = true;
            this.disabledCloseButton = true;
            let dataSigningUpdate = []; 
            checkIfLeadReqAreAnswered({ programId : this.selectedProgram})
            .then(result => {
                this.spinnerSigningRequest = true;
                if(result.hasOwnProperty('Error') && result.Error){
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: result.Error, variant: 'error' }),);
                    this.spinnerSigningRequest = false;
                }
                else if(result.hasOwnProperty('Success')){
                    closePreviousPhase({ programId : this.selectedProgram})
                    .then(result => {
                        //RRA - ticket BUG Marouane sur SignedShare - 13012023
                        this.dataSigningRequestClosePreviousPhase = result.lstSigningRequests != undefined ? result.lstSigningRequests : this.dataSigningRequest;
                        console.log('resul dataSigningRequestClosePreviousPhase == ',this.dataSigningRequestClosePreviousPhase);
    
                        this.closePreviousBtnClick = true;
                        this.dispatchEvent(new ShowToastEvent({title: 'Success', message: this.label.phasesClosed, variant: 'success' }),);
                        this.getSigningDetails();
                        fireEvent(this.pageRef, 'refreshReinsurerFilters', '') ;//MRA W-0947 29/08/2022 Reinsurer list on Signing not showing
                    })
                    .catch(error => {
                        this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
                        this.spinnerSigningRequest = false;
                    });
                }
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
                this.spinnerSigningRequest = false;
            });
    }

    getSigningDetails(){
        
        this.spinnerSigningRequest = true;
        this.isSetupRequest = false ; //MRA 14/07/2022 : W-0940
	//AMI 01/06/22: W-0940
        if(this.selectedProgram != null){
            getSigningDetails({programId: this.selectedProgram, treatyId: this.selectedTreaty, reinsurerId: this.selectedReinsurer, brokerId: this.selectedBroker, reinsurerStatus: this.selectedReinsurerStatus, isClosePreviousBtnClick : this.closePreviousBtnClick})
            .then(result => {
                console.log('result == ', result);
                //this.closePreviousBtnClick = false;
                let profileName = result.userProfile;
                this.displayTwoFieldForPremium = result.displayTwoFieldForPremium;
                this.spinnerSigningRequest = true;
                let updDataSigningRequest = [];
                let updDataSigningRequestClosePrev = [];
                let dataSigningRequest = result.lstSigningRequest;
                let mapIdReqReq = new Map();
                let mapTECH_RelatedLeadPlacementRequestReq = new Map();
                let mapIdTreatyReq = new Map();
                let isDeactivatedProg = result.isDeactivatedProg;  //RRA - ticket 585 - 13032023
                //RRA - ticket BUG Marouane sur SignedShare - 13012023
                if (this.closePreviousBtnClick){
                    if (this.dataSigningRequestClosePreviousPhase.length > 0 ){
                        for (let j=0;j<this.dataSigningRequestClosePreviousPhase.length;j++){
                            let rowClosePrev = {...this.dataSigningRequestClosePreviousPhase[j]}
                            mapIdReqReq.set(rowClosePrev.Id, rowClosePrev);
                            mapTECH_RelatedLeadPlacementRequestReq.set(rowClosePrev.TECH_RelatedLeadPlacementRequest__c + '_' + rowClosePrev.Treaty__c, rowClosePrev);
                            mapIdTreatyReq.set(rowClosePrev.Treaty__c, rowClosePrev);
    
                        }
    
                        for (let i=0;i<dataSigningRequest.length;i++){
                            let rowData = {...dataSigningRequest[i]};
    
                             //RRA - ticket 1414 - 31012023
                            if (mapIdReqReq.has(rowData.Id)){
                                rowData.SignedShare__c = mapIdReqReq.get(rowData.Id).SignedShare__c != null ? mapIdReqReq.get(rowData.Id).SignedShare__c : rowData.SignedShare__c;
                                rowData.WrittenShare__c = mapIdReqReq.get(rowData.Id).WrittenShare__c !=null ? mapIdReqReq.get(rowData.Id).WrittenShare__c : rowData.WrittenShare__c;
    
                            //RRA - ticket 1404 - 08022023
                            }else if (mapTECH_RelatedLeadPlacementRequestReq.has(rowData.TECH_RelatedLeadPlacementRequest__c + '_' + rowData.Treaty__c)){
                                rowData.SignedShare__c = mapTECH_RelatedLeadPlacementRequestReq.get(rowData.TECH_RelatedLeadPlacementRequest__c + '_' + rowData.Treaty__c).SignedShare__c != null ? mapTECH_RelatedLeadPlacementRequestReq.get(rowData.TECH_RelatedLeadPlacementRequest__c + '_' + rowData.Treaty__c).SignedShare__c : rowData.SignedShare__c;
                                rowData.WrittenShare__c = mapTECH_RelatedLeadPlacementRequestReq.get(rowData.TECH_RelatedLeadPlacementRequest__c + '_' + rowData.Treaty__c).WrittenShare__c != null ? mapTECH_RelatedLeadPlacementRequestReq.get(rowData.TECH_RelatedLeadPlacementRequest__c + '_' + rowData.Treaty__c).WrittenShare__c : rowData.WrittenShare__c;
                            }
                            updDataSigningRequestClosePrev.push(rowData);
                        }
                        this.dataSigningRequest = updDataSigningRequestClosePrev;
                        //RRA - ticket 1421 - 01092023 - Add idProgram on updateSigningReqClosePrevPhase to update writtenShare
                        updateSigningReqClosePrevPhase({ lstReqClosePrevPhase : this.dataSigningRequest, idProgram : this.selectedProgram})
                        .then(result => {
                            window.location.reload();
                            console.log('update close prev sucessfully');
                        })
                        .catch(error => {
                            this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
                            this.spinnerSigningRequest = false;
                        });
                    }else{
                        this.dataSigningRequest = dataSigningRequest;
                    }
                }else{
                    this.dataSigningRequest = dataSigningRequest;
                }
                let lstFilteredSigningRequest = result.lstFilteredSigningRequest;
                let setFilteredDataSigningReq = new Set();
                let canDisableButtonNotify = false;

                for(let i = 0; i < lstFilteredSigningRequest.length; i++){
                    setFilteredDataSigningReq.add(lstFilteredSigningRequest[i].Id);
                }

                this.showClosePreviousPhaseBtn = result.showClosePreviousPhaseBtn;
                this.titleCountSigningRequest = 'Signing Requests (' + this.dataSigningRequest.length + ')';
                this.buttonSignPoolVisibility = result.isSignPoolVisible;
                this.buttonDeleteVisbility = result.isDeleteVisible;
                this.isProfileSuper = result.isDeleteVisible;
                this.disableBtnSend = false; //Note SAU: visibility for button requested on 23/06
                this.strPremiumOtherCurrencyLabel = 'Premium (' +result.currencyOtherLabel +')';
                this.totalCededPremiumOther = result.totalCededPremiumOther;
                this.totalCededPremiumEUR = result.totalCededPremiumEUR;
                this.allowAskForValidation = result.allowAskForValidation;
                this.contractualDocSigningPresent = result.contractualDocSigningPresent;
                let renewed = result.renewStatus;

                let isReinsurerStatusNotSetup = false;
                let isReinsurerStatusSetup = false;
                let updDataSigningPool = [];
                let isFlag = false;
                let isMergeStatDiffSetup = false;
                let isMergeStatEqSetup = false;
                
                //AMI 01/06/22: W-0940
                //get total count request
                //this.nbrTotalReq = this.dataSigningRequest.length;
                for(let i = 0; i < this.dataSigningRequest.length; i++){
                    let rowReq = { ...this.dataSigningRequest[i] };
                    if (rowReq.ReinsurerStatus__c === 'Sent' || rowReq.ReinsurerStatus__c === 'Timeout' || rowReq.ReinsurerStatus__c === 'Signed' || rowReq.ReinsurerStatus__c === 'Signed By R.M.'){
                        isFlag = true;
                    }else{
                        isFlag = false;
                    }

                   //RRA - ticket 1410 / 1411 - 13042023
                   if(rowReq.ExpectedResponseDate__c === undefined && rowReq.isReopenPreviousPhase__c && isFlag === false){
                    this.hideCheckbox = true ;
                    }else if(rowReq.ExpectedResponseDate__c === undefined && rowReq.isReopenPreviousPhase__c === false && isFlag){
                        this.hideCheckbox = true ;
                    }else if (rowReq.ExpectedResponseDate__c !== undefined && rowReq.isReopenPreviousPhase__c && isFlag){
                        this.hideCheckbox = false ;
                    }else if (rowReq.ExpectedResponseDate__c !== undefined && rowReq.isReopenPreviousPhase__c === false && isFlag){
                        this.hideCheckbox = false ;
                    }else if (rowReq.ExpectedResponseDate__c === undefined && rowReq.isReopenPreviousPhase__c === false  && isFlag === false){
                        this.hideCheckbox = true ;
                    }
					//AMI 01/06/22: W-0940
                    //count req in sent status
                    if(this.dataSigningRequest[i] && this.dataSigningRequest[i].ReinsurerStatus__c === 'Setup'){
                        this.isSetupRequest = true ;//MRA 14/07/2022 : W-0940
                    }
                    // RRA - 869
                    if (rowReq.SigningStatus__c == '4'){
                        canDisableButtonNotify = true;
                    }
                    //RRA - 872
                    //MBE - W-087
                    if(rowReq.TECH_RelatedLeadPlacementRequest__c != null && rowReq.TECH_RelatedLeadPlacementRequest__c != undefined){
                        if(rowReq.TECH_Recovery_RelatedLeadPlacementReq__c == 'Lead'){
                            rowReq['boldStyle'] = "font-weight: bold;";
                            rowReq['isLead'] = true;
                        }
                        else{
                            rowReq['boldStyle'] = "";
                            rowReq['isLead'] = false;
                        }
                    }
                    else{
                        rowReq['boldStyle'] = "";
                        rowReq['isLead'] = false;
                    }

                    rowReq['TreatyPlacementShare'] = parseFloat(rowReq.Treaty__r.PlacementShare_Perc__c).toFixed(6).replace('.',',');

                    if(setFilteredDataSigningReq.has(rowReq.Id)){
                        rowReq['displayInTable'] = true;
                    }
                    else{
                        rowReq['displayInTable'] = false;
                    }

                    rowReq['divId'] = rowReq.Id;
                    rowReq['divId2'] = rowReq.Id;
                    rowReq['WrittenShareVal'] = parseFloat(rowReq.WrittenShare__c).toFixed(6).replace('.',',');
                    rowReq['SignedShareVal'] = parseFloat(rowReq.SignedShare__c).toFixed(6).replace('.',',');

                    if(rowReq.RiskCarrier__r != undefined){
                        rowReq['RiskCarrierName'] = this.dataSigningRequest[i].RiskCarrier__r.Name;
                    }

                    if(rowReq.FinancialEntity__r != undefined){
                        rowReq['FinancialName'] = this.dataSigningRequest[i].FinancialEntity__r.Name;
                    }

                    rowReq['loadingTextRisk'] = false;
                    rowReq['searchLookupRecordsRisk'] = [];
                    rowReq['messageFlagRisk'] = false;
                    rowReq['loadingTextFinancial'] = false;
                    rowReq['searchLookupRecordsFinancial'] = [];
                    rowReq['messageFlagFinancial'] = false;

                    if(rowReq.Pool__c != null && rowReq.Pool__c != undefined){
                        rowReq['isRequestPool'] = true;
                        rowReq['disableSignedShare'] = true;
                        rowReq['ReinsurerPoolName'] = rowReq.Pool__r.Name;
                        rowReq['ReinsurerOrPoolName'] = rowReq.Pool__r.Name;
                    }
                    else{
                        if(rowReq.Broker__c == null || rowReq.Broker__c == undefined){
                            rowReq['disableRetro'] = true;
                        }
                        else{
                            rowReq['disableRetro'] = false;
                        }

                        rowReq['isRequestPool'] = false;
                        rowReq['ReinsurerPoolName'] = rowReq.TECH_ReinsurerName__c;
                        rowReq['ReinsurerName'] = rowReq.TECH_ReinsurerName__c;
                        rowReq['ReinsurerOrPoolName'] = rowReq.TECH_ReinsurerName__c;
                        rowReq['ReinsurerPoolName'] = 'MarketSubmission?c__program=' + this.selectedProgram + '-' + rowReq.Id;
                        rowReq['isPremiumDisable'] = true;
                    }

                    if(rowReq.isRequestPool == false || rowReq.isRequestPool == undefined || rowReq.isRequestPool == null){
                        if(rowReq.ReinsurerStatus__c != 'Setup' && profileName != 'System Administrator' && profileName != 'AGRE_System Admin' && profileName != 'AGRE_Delegated Admin'){
                            rowReq['disableSignedShare'] = true;
                            isReinsurerStatusNotSetup = true;
                        }
                        else{
                            this.requestsSetup.push(rowReq);
                        }
                    }

                    if(rowReq.ReinsurerStatus__c == 'Setup' && (rowReq.isRequestPool == false || rowReq.isRequestPool == undefined || rowReq.isRequestPool == null)){
                        isReinsurerStatusSetup = true;
                        rowReq['disableSignedShare'] = false;
                    }
                    if((rowReq.Treaty__r.TypeofTreaty__c == '3' || rowReq.Treaty__r.TypeofTreaty__c == '4') && (rowReq.Treaty__r.PremiumDeposit__c == 'Yes')){
                        rowReq['isPremiumDisable'] = false;
                    }

                    if(rowReq.Treaty__r.Deductions__c == '2'){
                        rowReq['disableDeduction'] = true;
                    }
                    else{
                        rowReq['disableDeduction'] = false;
                    }

                    let lossDepositModeReqOpt;
                    let lossDepositModeReqUpd = [];
                    if(rowReq.Program__r.LossDepositLevel__c != undefined){
                         //RRA - ticket 1421 - 06062023
                        if (this.isProfileSuper){
                            for(let j = 0; j < this.lossDepositModeOpt.length; j++){
                                let row = { ...this.lossDepositModeOpt[j] };
                                lossDepositModeReqUpd.push(row);
                            }
                            rowReq['LossDepositModeOpt'] = lossDepositModeReqUpd;
                         }else{
                            if(rowReq.Program__r.LossDepositLevel__c == 'Program'){
                                //RRA - ticket 1421 - 06062023
                                if(rowReq.Program__r.LossDeposit__c == '2'){
                                    rowReq['disableLossDepositMode'] = true;
                                }else if(rowReq.Program__r.LossDeposit__c == '1'){
                                    rowReq['disableLossDepositMode'] = false;
                                }
                                
                                 //RRA - ticket 1554 - 28082023
                                if (rowReq.TECH_isAdmin__c){
                                    if (rowReq.Program__r.LossDepositMode__c.includes(rowReq.LossDepositMode__c)){
                                        lossDepositModeReqOpt = rowReq.Program__r.LossDepositMode__c; // Keep data on LossDepositMode__c from program if value exists in conditions
                                    }else{
                                        lossDepositModeReqOpt = rowReq.LossDepositMode__c + ';' + rowReq.Program__r.LossDepositMode__c; // Keep data on LossDepositMode__c from request if value not exists in conditions
                                    }
                                }else{
                                    lossDepositModeReqOpt = rowReq.Program__r.LossDepositMode__c; // Keep data on LossDepositMode__c from conditions
                                }
                            }
                            else if(rowReq.Program__r.LossDepositLevel__c == 'Treaty'){
                                if(rowReq.Treaty__r.LossDeposit__c == '2'){
                                    rowReq['disableLossDepositMode'] = true;
                                }else if(rowReq.Treaty__r.LossDeposit__c == '1'){
                                    rowReq['disableLossDepositMode'] = false;
                                }
                                
                                 //RRA - ticket 1554 - 28082023
                                 if (rowReq.TECH_isAdmin__c){
                                    if (rowReq.Treaty__r.LossDepositMode__c.includes(rowReq.LossDepositMode__c)){
                                        lossDepositModeReqOpt = rowReq.Treaty__r.LossDepositMode__c; // Keep data on LossDepositMode__c from program if value exists in conditions
                                    }else{
                                        lossDepositModeReqOpt = rowReq.LossDepositMode__c + ';' + rowReq.Treaty__r.LossDepositMode__c; // Keep data on LossDepositMode__c from request if value not exists in conditions
                                    }
                                }else{
                                    lossDepositModeReqOpt = rowReq.Treaty__r.LossDepositMode__c; // Keep data on LossDepositMode__c from conditions
                                }
                            }
                        }
                    }else{
                        //RRA - ticket 1421 - 31072023
                        if (this.isProfileSuper){
                            if (rowReq.Program__r.LossDeposit__c == '2'){
                                for(let j = 0; j < this.lossDepositModeOpt.length; j++){
                                    let row = { ...this.lossDepositModeOpt[j] };
                                    lossDepositModeReqUpd.push(row);
                                }
                                rowReq['LossDepositModeOpt'] = lossDepositModeReqUpd; 
                            }
                         }else{
                            console.log('is Not Profil super user');
                            //let lossDepositModeReqOpt;
                            if (rowReq.Program__r.LossDeposit__c == '2'){
                                let emptyList = [];
                                if (rowReq.TECH_isAdmin__c){
                                    lossDepositModeReqOpt = rowReq.LossDepositMode__c;
                                    rowReq['LossDepositModeOpt'] = lossDepositModeReqOpt; 
                                }else{
                                    rowReq['LossDepositModeOpt'] = emptyList;
                                }
                                rowReq['disableLossDepositMode'] = true;
                            }else if(rowReq.Program__r.LossDeposit__c == '1'){
                                //RRA - ticket 1554 - 28082023
                                if (rowReq.TECH_isAdmin__c){
                                    if (rowReq.Program__r.LossDepositMode__c.includes(rowReq.LossDepositMode__c)){
                                        rowReq['LossDepositModeOpt'] = rowReq.Program__r.LossDepositMode__c; // Keep data on LossDepositMode__c from program if value exists in conditions
                                    }else{
                                        rowReq['LossDepositModeOpt'] = rowReq.LossDepositMode__c + ';' + rowReq.Program__r.LossDepositMode__c; // Keep data on LossDepositMode__c from request if value not exists in conditions
                                    }
                                }else{
                                    rowReq['LossDepositModeOpt']  = rowReq.Program__r.LossDepositMode__c; // Keep data on LossDepositMode__c from conditions
                                }                      
                                rowReq['disableLossDepositMode'] = false; 
                            }
                         }
                    }
                    console.log('lossDepositModeReqOpt == ', lossDepositModeReqOpt);
                    if(lossDepositModeReqOpt != undefined){
                        let lossDepositModeExisted = lossDepositModeReqOpt.split(';');
                        let lossDepositModeReqUpd = [];

                        for(let i = 0; i < lossDepositModeExisted.length; i++){
                            for(let j = 0; j < this.lossDepositModeOpt.length; j++){
                                let row = { ...this.lossDepositModeOpt[j] };
                                if(row.value == lossDepositModeExisted[i]){
                                    lossDepositModeReqUpd.push(row);
                                }
                            }
                        }
                        rowReq['LossDepositModeOpt'] = lossDepositModeReqUpd; 
                    }

                    if(rowReq.Pool__c != null){
                        updDataSigningPool.push(rowReq);
                    }

                    updDataSigningRequest.push(rowReq);
                }

                // RRA - 869
                if (canDisableButtonNotify == true){
                    this.disableThisButton = true;
                }

                this.dataSigningRequest = updDataSigningRequest;
                this.calculateTotalSignedWrittenShare();

                if(renewed == 'Identical Renew'){
                    this.disableReopenPreviousPhase = false;
                }
                else if(isReinsurerStatusNotSetup == true && this.isProfileSuper == false){
                    this.disableReopenPreviousPhase = true;
                }
                else{
                    this.disableReopenPreviousPhase = false;
                }

                if(isReinsurerStatusSetup == true || this.dataSigningRequest.length == 0){
                    this.disableUpdateRemind = true;
                }
                else{
                    this.disableUpdateRemind = false;
                }

                if(this.dataSigningRequest.length == 0 && this.isProfileSuper == false){
                    this.disableReopenPreviousPhase = true;
                }

                this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
                this.dataSigningPool = updDataSigningPool;
                this.error = undefined;
                this.spinnerSigningRequest = false;

                //Program - RRA - ticket 585 - 14032023
                if (isDeactivatedProg){
                    this.disableBtnSigning = true; 
                    this.disableBtnSend = true; 
                    this.disableReopenPreviousPhase = true; 
                    this.hideWrittenToSignBtn = true;
                    this.disableThisButton = true;
                }else {
                    this.disableBtnSigning = false; 
                    this.disableBtnSend = false; 
                    //RRA - ticket 1410- 13042023
                    if(isReinsurerStatusNotSetup == true && this.isProfileSuper == false){
                        this.disableReopenPreviousPhase = true;
                    }else if(this.dataSigningRequest.length == 0 && this.isProfileSuper == false){
                        this.disableReopenPreviousPhase = true;
                    }else{
                        this.disableReopenPreviousPhase = false;
                    }

                    //this.disableReopenPreviousPhase = false; 
                    this.hideWrittenToSignBtn = false;
                    //this.disableThisButton = false; //RRA - ticket 869 - 15012023
                }
            })
            .catch(error => {
                this.error = error;
                this.spinnerSigningRequest = false;
                this.disableUpdateRemind = true;
                this.closePreviousBtnClick = false;
            });
        }
        else{
            this.dataSigningRequest = [];
            this.titleCountSigningRequest = 'Signing Requests (' + this.dataSigningRequest.length + ')';
            this.spinnerSigningRequest = false;
            this.closePreviousBtnClick = false;
        }
        this.spinnerSigningRequest = false;
    }

	 //AMI 01/06/22: W-0940
	    //determine when to disable "Written to sign share" button
	    get hideWrittenToSignBtn(){
	        //return !this.isProfileSuper && !(this.nbrSetupReq === this.nbrTotalReq);
            return !this.isSetupRequest;//MRA 14/07/2022 : W-0940
	    }
	
	    //AMI 01/06/22: W-0940
	    //refresh parent component in order to reevaluate "Written to sign share" button visibility
	    updateComponent(){
	        this.getSigningDetails();//MRA 14/07/2022 : W-0940
	    }
    calculateTotalSignedWrittenShare(){
        let inputs = this.template.querySelectorAll('lightning-input');
        let mapDataInput = [];
        let updDataSigningRequest = [];

        for(let input of inputs){
            if(input.name == 'SignedShare__c'){
                let id = input.id.split("-")[0];
                mapDataInput.push({key:id, value:input.value});
            }
        }

        for(let i = 0; i < this.dataSigningRequest.length; i++){
            let rowReq = { ...this.dataSigningRequest[i] };

            for(let j = 0; j < mapDataInput.length; j++){
                let reqId = mapDataInput[j].key;
                let dataInputValue = mapDataInput[j].value;
                if(rowReq.Id == reqId){
                    rowReq['SignedShare__c'] = parseFloat(dataInputValue);
                }
            }

            updDataSigningRequest.push(rowReq);
        }

        let mapLstRequestByTreatyId = new Map();

        for(let i = 0; i < updDataSigningRequest.length; i++){
            let rowReq = { ...updDataSigningRequest[i] };
            let lstRequestByTreaty = [];
            if(mapLstRequestByTreatyId.has(rowReq.Treaty__c)){
                lstRequestByTreaty = mapLstRequestByTreatyId.get(rowReq.Treaty__c);
            }

            lstRequestByTreaty.push(rowReq);
            mapLstRequestByTreatyId.set(rowReq.Treaty__c, lstRequestByTreaty);
        }

        let lstUpdSumRow = [];

        for(let [key, value] of mapLstRequestByTreatyId) {
            let lstRequest = value;
            let totalSignedShare = 0;
            let totalWrittenShare = 0;

            for(let i = 0; i < lstRequest.length; i++){
                if(lstRequest[i].SignedShare__c != undefined && lstRequest[i].SignedShare__c != null && !isNaN(lstRequest[i].SignedShare__c)){
                    totalSignedShare = parseFloat(totalSignedShare + lstRequest[i].SignedShare__c);
                }

                if(lstRequest[i].WrittenShare__c != undefined && lstRequest[i].WrittenShare__c != null && !isNaN(lstRequest[i].WrittenShare__c)){
                    totalWrittenShare = parseFloat(totalWrittenShare + lstRequest[i].WrittenShare__c);
                }
            }

            let totalSumRow = {};
            totalSumRow['TreatyId'] = key;
            totalSumRow['TotalWrittenShare'] = parseFloat(totalWrittenShare).toFixed(6).replace('.', ',');
            totalSumRow['TotalSignedShare'] = parseFloat(totalSignedShare).toFixed(6).replace('.', ',');
            lstUpdSumRow.push(totalSumRow);
        }

        for(let i = 0; i < this.dataSigningRequest.length; i++){
            for(let j = 0; j < lstUpdSumRow.length; j++){
                if(this.dataSigningRequest[i].Treaty__c == lstUpdSumRow[j].TreatyId){
                    this.dataSigningRequest[i]['TotalWrittenShare'] = lstUpdSumRow[j].TotalWrittenShare;
                    this.dataSigningRequest[i]['TotalSignedShare'] = lstUpdSumRow[j].TotalSignedShare;

                    if(parseFloat(this.dataSigningRequest[i].Treaty__r.PlacementShare_Perc__c) == parseFloat(lstUpdSumRow[j].TotalSignedShare.replace(',', '.'))){
                        this.dataSigningRequest[i]['PlacementShareEqualSignedShare'] = true;
                    }
                    else{
                        this.dataSigningRequest[i]['PlacementShareEqualSignedShare'] = false;
                    }
                }
            }
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: BROKER_STATUS_FIELD})
    setBrokerStatusPicklistOptions({error, data}) {
        if(data){
            this.brokerStatusOpt = data.values;
        }
        else{
            this.error = error;
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: LOSS_DEPOSIT_MODE_FIELD})
    setLossDepositModePicklistOptions({error, data}) {
        if(data){
            this.lossDepositModeOpt = data.values;

            if(this.dataSigningRequest != undefined){
                let updDataSigningRequest = [];

                for(let i = 0; i < this.dataSigningRequest.length; i++){
                    let rowReq = { ...this.dataSigningRequest[i] };
                    let lossDepositModeReqOpt;

                    if(rowReq.Program__r.LossDepositLevel__c != undefined){

                        if(rowReq.Program__r.LossDepositLevel__c == 'Program'){
                            lossDepositModeReqOpt = rowReq.Program__r.LossDepositMode__c;
                        }
                        else if(rowReq.Program__r.LossDepositLevel__c == 'Treaty'){
                            lossDepositModeReqOpt = rowReq.Treaty__r.LossDepositMode__c;
                        }
                    }

                    if(rowReq.Program__r.LossDepositLevel__c == undefined || rowReq.Program__r.LossDepositLevel__c == null){
                        rowReq['disableLossDepositMode'] = true;
                    }

                    if(lossDepositModeReqOpt != undefined){
                        let lossDepositModeExisted = lossDepositModeReqOpt.split(';');
                        let lossDepositModeReqUpd = [];

                        for(let i = 0; i < lossDepositModeExisted.length; i++){
                            for(let j = 0; j < this.lossDepositModeOpt.length; j++){
                                let row = { ...this.lossDepositModeOpt[j] };
                                if(row.value == lossDepositModeExisted[i]){
                                    lossDepositModeReqUpd.push(row);
                                }
                            }
                        }

                        rowReq['LossDepositModeOpt'] = lossDepositModeReqUpd;
                    }

                    updDataSigningRequest.push(rowReq);
                }

                this.dataSigningRequest = updDataSigningRequest;
                this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
            }
        }
        else{
            this.error = error;
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: PREMIUM_DEPOSIT_FIELD})
    setPremiumDepositPicklistOptions({error, data}) {
        if(data){
            this.premiumDepositOpt = data.values;
        }
        else{
            this.error = error;
        }
    }

    handleChangeValue(event){
        this.isValueChange = true;
        let fieldName = event.currentTarget.name;
        let eventId = event.currentTarget.id;
        let value = event.currentTarget.value;
        let reqId = eventId.split('-')[0];
        //this.setIdReq.add(reqId); // RRA 30/05/2022
        let updDataSigningRequest = [];
        let lossDepositLevel;
        let lossDeposit;
        let selectedRowReinsurerPool;
        let selectedRowBroker;
        let isRequestPooll;

        if(fieldName == 'LossDepositMode__c'){
            console.log('reqId LossDepositMode == ', reqId);
            this.lstIdReqOnChangeLossDeposit.push(reqId); //RRA - Ticket 1866 - 11012023
            if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                lossDepositLevel = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
            }
            
            if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                lossDeposit = this.dataSigningRequest[0].Program__r.LossDeposit__c;
            }
            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                isRequestPooll = rowReq.isRequestPool;
                if(rowReq.Id == reqId){
                    if(rowReq.Broker__c != null && rowReq.Broker__c != undefined){
                        selectedRowBroker = rowReq.Broker__c;
                    }
                    if(rowReq.isRequestPool == true){
                        selectedRowReinsurerPool = rowReq.Pool__c;
                    }
                    else{
                        selectedRowReinsurerPool = rowReq.Reinsurer__c;
                    }
                }
            }

            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };

                if(lossDepositLevel == 'Program'){
                    let rowReinsurerPool;

                    if(rowReq.isRequestPool == true){
                        rowReinsurerPool = rowReq.Pool__c;
                    }
                    else{
                        rowReinsurerPool = rowReq.Reinsurer__c;
                    }

                    if(selectedRowBroker != null && selectedRowBroker != undefined){
                        if(rowReq.isRequestPool == true && rowReq.Broker__c == selectedRowBroker && rowReq.Pool__c == selectedRowReinsurerPool){
                            rowReq[fieldName] = value;
                        }
                        else if(rowReq.isRequestPool == false && rowReq.Broker__c == selectedRowBroker && rowReq.Reinsurer__c == selectedRowReinsurerPool){
                            rowReq[fieldName] = value;
                        }
                    }
                    else{
                        if(rowReq.isRequestPool == true && rowReq.Pool__c == selectedRowReinsurerPool){
                            rowReq[fieldName] = value;
                        }
                        else if(rowReq.isRequestPool == false && rowReq.Reinsurer__c == selectedRowReinsurerPool){
                            rowReq[fieldName] = value;
                        }
                    }
                }
                else if(lossDepositLevel == 'Treaty'){
                    if(rowReq.Id == reqId){
                        rowReq[fieldName] = value;
                    }
                }
                updDataSigningRequest.push(rowReq);
            }
            
            this.dataSigningRequest = updDataSigningRequest;
            this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
            
             //RRA - ticket 1397 - 09012023 - SIgnedShare
             getListIdOrginalRequestNotNull({programId : this.selectedProgram, pcc : this.pcc, uwy : this.uwry, reinsurer : selectedRowReinsurerPool})
             .then(result => {;
                 //RRA - ticket 1421 - 08092023 - Operate on Original Request Or Request with Status Setup
                 if(result.isLossDepositModeTreatySetup){
                    if (lossDeposit == '1'){ // lossDeposit to Yes
                        if (lossDepositLevel == 'Program'){
                            this.lstIdReqOnChangeSetup = result.lstOrigReqNull;
                        }else if (lossDepositLevel == 'Treaty'){
                            if (result.lstOrigReqNull.includes(reqId)){
                                this.lstIdReqOnChangeSetup.push(reqId);
                                let removeDuplication = this.lstIdReqOnChangeSetup.filter((item,index) => this.lstIdReqOnChangeSetup.indexOf(item) === index);
                                this.lstIdReqOnChangeSetup = removeDuplication;
                             }
                        }
                    }else if (lossDeposit == '2'){ // lossDeposit to No
                        if (result.lstOrigReqNull.includes(reqId)){
                            this.lstIdReqOnChangeSetup.push(reqId);
                            let removeDuplication = this.lstIdReqOnChangeSetup.filter((item,index) => this.lstIdReqOnChangeSetup.indexOf(item) === index);
                            this.lstIdReqOnChangeSetup = removeDuplication;
                         }
                    }
                    
                 }else{
                     //RRA - ticket 1421 - 08092023 - Operate on Last Version Request Or Request with Status Send / Timeout / Refused / Signed
                     if (lossDeposit == '1'){
                        if (lossDepositLevel == 'Program'){
                            this.lstIdReqOnChange.push(result.lstOrigReqNotNull);
                         }else if (lossDepositLevel == 'Treaty'){
                            this.lstIdReqOnChange.push(reqId);
                            let removeDuplication = this.lstIdReqOnChange.filter((item,index) => this.lstIdReqOnChange.indexOf(item) === index);
                            this.lstIdReqOnChange = removeDuplication;
                         }
                     }else if (lossDeposit == '2'){
                        this.lstIdReqOnChange.push(reqId);
                        let removeDuplication = this.lstIdReqOnChange.filter((item,index) => this.lstIdReqOnChange.indexOf(item) === index);
                        this.lstIdReqOnChange = removeDuplication;
                     }
                     
                 }
             })
             .catch(error => {
                 this.error = error;
             });
             
        }
        else if(fieldName == 'SignedShare__c'){
            this.calculateTotalSignedWrittenShare();
            //RRA - ticket 1421 - 31082023
            if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                lossDepositLevel = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
            }
            
            if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                lossDeposit = this.dataSigningRequest[0].Program__r.LossDeposit__c;
            }
            getRequestResult({requestId : reqId, programId : this.selectedProgram})
            .then(result => { 
                let selectedReinsurer = result[0].Reinsurer__c;
                 //RRA - ticket 1397 - 09012023 - SIgnedShare
                 getListIdOrginalRequestNotNull({programId : this.selectedProgram, pcc : this.pcc, uwy : this.uwry, reinsurer : selectedReinsurer})
                 .then(result => {
                     //RRA - ticket 1421 - 08092023 - Operate on Original Request Or Request with Status Setup
                    if(result.isLossDepositModeTreatySetup){
                        if (result.lstOrigReqNull.includes(reqId)){
                        this.lstIdReqOnChangeSetup.push(reqId);
                        let removeDuplication = this.lstIdReqOnChangeSetup.filter((item,index) => this.lstIdReqOnChangeSetup.indexOf(item) === index);
                        this.lstIdReqOnChangeSetup = removeDuplication;
                        }
                    }else{
                        if (lossDeposit == '1'){
                            //RRA - ticket 1421 - 08092023 - Operate on Last Version Request Or Request with Status Send / Timeout / Refused / Signed
                            if (lossDepositLevel == 'Program'){
                                this.lstIdReqOnChange.push(result.lstOrigReqNotNull);
                            }else if (lossDepositLevel == 'Treaty'){
                                this.lstIdReqOnChange.push(reqId);
                                let removeDuplication = this.lstIdReqOnChange.filter((item,index) => this.lstIdReqOnChange.indexOf(item) === index);
                                this.lstIdReqOnChange = removeDuplication;
                            }
                        }else if (lossDeposit == '2'){
                                this.lstIdReqOnChange.push(reqId);
                                let removeDuplication = this.lstIdReqOnChange.filter((item,index) => this.lstIdReqOnChange.indexOf(item) === index);
                                this.lstIdReqOnChange = removeDuplication;
                        }
                        
                    }
                 })
                 .catch(error => {
                     this.error = error;
                 });
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: error.message, variant: 'error'}), );
            });
        }
        if (fieldName == 'BrokerStatus__c'){ //RRA - 863 Signing - Broker status unique pour un couple B/R
            //RRA - ticket 1421 - 31082023
            if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                lossDepositLevel = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
            }
            
            if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                lossDeposit = this.dataSigningRequest[0].Program__r.LossDeposit__c;
            }
            getRequestResult({requestId : reqId, programId : this.selectedProgram})
            .then(result => { 
                let selectedBroker = result[0].Broker__c;
                let selectedReinsurer = result[0].Reinsurer__c;

                 //RRA - ticket 1397 - 09012023 - BrokerStatus
                 getListIdOrginalRequestNotNull({programId : this.selectedProgram, pcc : this.pcc, uwy : this.uwry, reinsurer : selectedReinsurer})
                 .then(result => {
                     console.log('result BrokerStatus == ', result);
                     //RRA - ticket 1421 - 08092023 - Operate on Original Request Or Request with Status Setup
                    if(result.isLossDepositModeTreatySetup){
                        if (result.lstOrigReqNull.includes(reqId)){
                        this.lstIdReqOnChangeSetup.push(reqId);
                        let removeDuplication = this.lstIdReqOnChangeSetup.filter((item,index) => this.lstIdReqOnChangeSetup.indexOf(item) === index);
                        this.lstIdReqOnChangeSetup = removeDuplication;
                        }
                    }else{
                        //RRA - ticket 1421 - 08092023 - Operate on Last Version Request Or Request with Status Send / Timeout / Refused / Signed
                        if (lossDeposit == '1'){
                            if (lossDepositLevel == 'Program'){
                                this.lstIdReqOnChange.push(result.lstOrigReqNotNull);
                             }else if (lossDepositLevel == 'Treaty'){
                                this.lstIdReqOnChange.push(reqId);
                                let removeDuplication = this.lstIdReqOnChange.filter((item,index) => this.lstIdReqOnChange.indexOf(item) === index);
                                this.lstIdReqOnChange = removeDuplication;
                             }
                        }else if (lossDeposit == '2'){
                            this.lstIdReqOnChange.push(reqId);
                            let removeDuplication = this.lstIdReqOnChange.filter((item,index) => this.lstIdReqOnChange.indexOf(item) === index);
                            this.lstIdReqOnChange = removeDuplication;
                        }
                       
                    }
                 })
                 .catch(error => {
                     this.error = error;
                 });
                
                for(let i = 0; i < this.dataSigningRequest.length; i++){
                    let rowReq = { ...this.dataSigningRequest[i] };
                    if(selectedBroker != null && selectedReinsurer != undefined){
                        if (rowReq.Broker__c == selectedBroker && rowReq.Reinsurer__c == selectedReinsurer){
                            rowReq[fieldName] = value;
                        }
                    }
                    updDataSigningRequest.push(rowReq);
                }
                this.dataSigningRequest = updDataSigningRequest;
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: error.message, variant: 'error'}), );
            });
        }
        if (fieldName == 'RetrocessionBrokerage__c' || fieldName == 'PremiumDeposit__c' || fieldName == 'Deductions__c'){  //RRA - ticket 1397 - 09012023 - RetrocessionBrokerage and PremiumDeposit and Deductions
            //RRA - ticket 1421 - 31082023
            if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                lossDepositLevel = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
            }  
            
            if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                lossDeposit = this.dataSigningRequest[0].Program__r.LossDeposit__c;
            }                                                                                                                       
            getRequestResult({requestId : reqId, programId : this.selectedProgram})
            .then(result => { 
                let selectedReinsurer = result[0].Reinsurer__c;
                
                 getListIdOrginalRequestNotNull({programId : this.selectedProgram, pcc : this.pcc, uwy : this.uwry, reinsurer : selectedReinsurer})
                 .then(result => {
                     console.log('result RetrocessionBrokerage and PremiumDeposit and Deductions == ', result);
                     //RRA - ticket 1421 - 08092023 - Operate on Original Request Or Request with Status Setup
                    if(result.isLossDepositModeTreatySetup){
                        if (result.lstOrigReqNull.includes(reqId)){
                        this.lstIdReqOnChangeSetup.push(reqId);
                        let removeDuplication = this.lstIdReqOnChangeSetup.filter((item,index) => this.lstIdReqOnChangeSetup.indexOf(item) === index);
                        this.lstIdReqOnChangeSetup = removeDuplication;
                        }
                    }else{
                        //RRA - ticket 1421 - 08092023 - Operate on Last Version Request Or Request with Status Send / Timeout / Refused / Signed
                        if (lossDeposit == '1'){
                            if (lossDepositLevel == 'Program'){
                                this.lstIdReqOnChange.push(result.lstOrigReqNotNull);
                             }else if (lossDepositLevel == 'Treaty'){
                                this.lstIdReqOnChange.push(reqId);
                                let removeDuplication = this.lstIdReqOnChange.filter((item,index) => this.lstIdReqOnChange.indexOf(item) === index);
                                this.lstIdReqOnChange = removeDuplication;
                             }
                        }else if (lossDeposit == '2'){
                            this.lstIdReqOnChange.push(reqId);
                            let removeDuplication = this.lstIdReqOnChange.filter((item,index) => this.lstIdReqOnChange.indexOf(item) === index);
                            this.lstIdReqOnChange = removeDuplication;
                        }
                    }
                     
                 })
                 .catch(error => {
                     this.error = error;
                 });
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: error.message, variant: 'error'}), );
            });
        }

    }

    //AMI 01/07/22 W:0947
    //js method to handle global select/deselect
    handleAllRequestSelections(event){
        //get all check box input
        let toggleList = this.template.querySelectorAll('[data-name^="toggle"]');

        //toggle all based on current global state
        for (let toggleElement of toggleList) {
            toggleElement.checked = event.target.checked;

            //fire all event listener on checkbox
            toggleElement.dispatchEvent(new Event('change'));
        }
    }

    handleChangeRequestCheckbox(event){
        let eventId = event.currentTarget.id;
        let reqId = eventId.split('-')[0];
        let checkValue = event.currentTarget.checked;
        let updDataSigningRequest = [];
        let updLstSelectedSigningRequest = [];
        let updLstSelectedSigningReqId = [];

        for(let i = 0; i < this.dataSigningRequest.length; i++){
            let rowReq = { ...this.dataSigningRequest[i] };
            if(rowReq.Id == reqId){
                rowReq['isChecked'] = checkValue;
            }
            if(rowReq.isChecked == true){
                updLstSelectedSigningRequest.push(rowReq);
                updLstSelectedSigningReqId.push(rowReq.Id);
            }
            updDataSigningRequest.push(rowReq);
        }

        this.dataSigningRequest = updDataSigningRequest;
        this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
        this.lstSelectedSigningRequest = updLstSelectedSigningRequest;
        this.lstSelectedSigningReqId = updLstSelectedSigningReqId;
    }


    handleSaveSigningRequest(event){
        console.log('OK Data SAVE signing');
        let lstReqId = [];
        let lstReqIdSetup = []; //RRA - ticket 1421 - 08092023
        let lstReqIdFinal = [];  //RRA - ticket 1421 - 31082023
        let lstIdReq;
        this.buttonNameClick = event.currentTarget.name;
        //let lossDepositLevel;
             console.log('this.lstIdReqOnChangeSetup == ', this.dataSigningRequest[0].Program__r.LossDeposit);
            //RRA - ticket 1421 - 31082023
            if(this.dataSigningRequest[0].Program__r.LossDepositLevel__c != undefined){
                this.lossDepositModeGlob = this.dataSigningRequest[0].Program__r.LossDepositLevel__c;
            }
            
            if(this.dataSigningRequest[0].Program__r.LossDeposit__c != undefined){
                this.lossDepositGlob = this.dataSigningRequest[0].Program__r.LossDeposit__c;
            }
            //RRA - 1397 - 06012023
            this.spinnerSigningRequest = true;
            if(this.isValueChange == false){
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.NoChanges, variant: 'error' }),);
                this.spinnerSigningRequest = false;
            }
            else{
                console.log('lossDepositModeGlob save == ',this.lossDepositModeGlob);
                console.log('lossDepositGlob save == ',this.lossDepositGlob);
                console.log('this.lstIdReqOnChange == ', this.lstIdReqOnChange);
                console.log('this.lstReqIdRiskCarr == ', this.lstReqIdRiskCarr);
                console.log('this.lstIdReqOnChangeSetup == ', this.lstIdReqOnChangeSetup);
                
                if (this.lossDepositGlob == '1'){
                    if (this.lossDepositModeGlob == 'Treaty'){
                        if (this.lstIdReqOnChange.length > 0){ // onChange on brokerSattus
                            lstReqId = this.lstIdReqOnChange;
                        }else if (this.lstIdReqOnChangeSetup.length > 0){ //RRA - ticket 1421 - 08092023
                            lstReqIdSetup = this.lstIdReqOnChangeSetup;
                        }
                        if (this.lstReqIdFinEnt.length > 0){ // onChange on finacial entity
                            lstReqId = this.lstReqIdFinEnt;
                        }else if (this.lstReqIdFinEntSetup.length > 0){ //RRA - ticket 1421 - 08092023
                            lstReqIdSetup = this.lstReqIdFinEntSetup;
                        }
                        if (this.lstReqIdRiskCarr.length > 0){ // onChange on risk Carrier
                            lstReqId = this.lstReqIdRiskCarr;
                        }else if (this.lstReqIdRiskCarrSetup.length > 0){ //RRA - ticket 1421 - 08092023
                            lstReqIdSetup = this.lstReqIdRiskCarrSetup;
                        }
                        
                    }else if (this.lossDepositModeGlob == 'Program'){
                        if (this.lstIdReqOnChange.length > 0){ // onChange on brokerSattus
                            for (let i=0;i<this.lstIdReqOnChange.length;i++){
                                lstReqId.push(this.lstIdReqOnChange[i]);
                            }
                        }else if (this.lstIdReqOnChangeSetup.length > 0){ //RRA - ticket 1421 - 08092023
                            lstReqIdSetup = this.lstIdReqOnChangeSetup;
                        }
                        
                        if (this.lstReqIdFinEnt.length > 0){ // onChange on finacial entity
                            for (let i=0;i<this.lstReqIdFinEnt.length;i++){
                                lstReqId.push(this.lstReqIdFinEnt[i]);
                            }
                        }else if (this.lstReqIdFinEntSetup.length > 0){ //RRA - ticket 1421 - 08092023
                            lstReqIdSetup = this.lstReqIdFinEntSetup;
                        }
                        
                        if (this.lstReqIdRiskCarr.length > 0){ // onChange on risk Carrier
                            for (let i=0;i<this.lstReqIdRiskCarr.length;i++){
                                lstReqId.push(this.lstReqIdRiskCarr[i]);
                            }
                        }else if (this.lstReqIdRiskCarrSetup.length > 0){ //RRA - ticket 1421 - 08092023
                            lstReqIdSetup = this.lstReqIdRiskCarrSetup;
                        }
                    }
                }else if (this.lossDepositGlob == '2'){
                    if (this.lstIdReqOnChange.length > 0){ // onChange on brokerSattus
                        lstReqId = this.lstIdReqOnChange;
                    }else if (this.lstIdReqOnChangeSetup.length > 0){ //RRA - ticket 1421 - 08092023
                        lstReqIdSetup = this.lstIdReqOnChangeSetup;
                    }
                    if (this.lstReqIdFinEnt.length > 0){ // onChange on finacial entity
                        lstReqId = this.lstReqIdFinEnt;
                    }else if (this.lstReqIdFinEntSetup.length > 0){ //RRA - ticket 1421 - 08092023
                        lstReqIdSetup = this.lstReqIdFinEntSetup;
                    }
                    if (this.lstReqIdRiskCarr.length > 0){ // onChange on risk Carrier
                        lstReqId = this.lstReqIdRiskCarr;
                    }else if (this.lstReqIdRiskCarrSetup.length > 0){ //RRA - ticket 1421 - 08092023
                        lstReqIdSetup = this.lstReqIdRiskCarrSetup;
                    }
                }

                if (this.lossDepositGlob == '1' && this.lossDepositModeGlob == 'Program'){
                     //RRA - ticket 1421 - 08092023
                    if (lstReqId.length > 0){ 
                        for (let i=0;i<lstReqId.length;i++){
                            for (let j=0;j<lstReqId[i].length;j++){   
                                lstReqIdFinal.push(lstReqId[i][j]);
                            }
                        }
                    }else if (lstReqIdSetup.length > 0){ 
                        lstReqIdFinal = lstReqIdSetup;
                    }
                }else if ((this.lossDepositGlob == '1' && this.lossDepositModeGlob == 'Treaty') || this.lossDepositGlob == '2'){
                    if (lstReqId.length > 0){
                            lstReqIdFinal = lstReqId;
                    }else if (lstReqIdSetup.length > 0){ 
                        lstReqIdFinal = lstReqIdSetup;
                    }
                }

                console.log('lstReqId == ', lstReqId);
                console.log('lstReqIdFinal == ', lstReqIdFinal);
                console.log('lstReqFinal == ', lstReqIdFinal);
                lstIdReq = JSON.parse(JSON.stringify(lstReqIdFinal));
                console.log('lstIdReq  == ', lstIdReq);
                const allValid = [...this.template.querySelectorAll('lightning-input')]
                    .reduce((validSoFar, inputCmp) => {
                                inputCmp.reportValidity();
                                return validSoFar && inputCmp.checkValidity();
                    }, true);
                if(allValid) {
                    this.isSave = true;
                    this.isAskToSave = false;
                    let inputs = this.template.querySelectorAll('lightning-input, lightning-combobox');
                    let mapDataInput = [];
                    let updDataSigningRequest = [];
                    for(let input of inputs){
                        if(input.name != 'Checkbox'){
                            let id = input.id.split("-")[0];
                            let nameId = id + '-' + input.name;
                            mapDataInput.push({key:nameId, value:input.value});
                        }
                    }
                    for(let i = 0; i < this.dataSigningRequest.length; i++){
                        let rowReq = { ...this.dataSigningRequest[i] };
                        for(let j = 0; j < mapDataInput.length; j++){
                            let reqId = mapDataInput[j].key.split('-')[0];
                            let dataInputName = mapDataInput[j].key.split('-')[1];
                            let dataInputValue = mapDataInput[j].value;
                            if(rowReq.Id == reqId){
                                if(dataInputName == 'SignedShare__c' || dataInputName == 'Deductions__c' || dataInputName == 'RetrocessionBrokerage__c'){
                                    rowReq[dataInputName] = parseFloat(dataInputValue);
                                }
                                else{
                                    rowReq[dataInputName] = dataInputValue;
                                }
                            }
                        }

                        updDataSigningRequest.push(rowReq);
                    }
                    console.log('updDataSigningRequest==', updDataSigningRequest);
                    this.dataSigningRequest = updDataSigningRequest;
                    this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');
                    console.log('dataSigningRequest==', this.dataSigningRequest);
                    console.log('lstIdReq SAVE ==', lstIdReq);
                    
                    //RRA - ticket 1421 - 31082023 -  Get list Id for the same broker / reinsurer with treaty different
                    getListIdRequest({lstIdOriginalRequest : lstIdReq})
                    .then(result => {
                        console.log('lstIdReq 22 SAVE ==', lstIdReq);
                        console.log('lstIdReqOnChangeLossDeposit 22 SAVE ==', this.lstIdReqOnChangeLossDeposit);
                        let lstReqIdFinal = result;
                        //RRA - 1104 - 03/06/2022
                        saveSigningRequest({ lstRequest : this.dataSigningRequest, lstIdReqId : lstIdReq, lstReqId : lstReqIdFinal, lossDepositMode : this.lossDepositModeGlob, lstIdReqOnChangeLossDep : this.lstIdReqOnChangeLossDeposit}) //RRA - ticket 1421 - 31082023 and //RRA - Ticket 1866 - 11012023
                        .then(result => {
                            if(result.hasOwnProperty('Error') && result.Error){
                                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: result.Error, variant: 'error' }),);
                                this.spinnerSigningRequest = false;
                            }
                            else{
                                // SRA - ticket 860 => Refresh Signing - Bouton save
                                if(this.buttonNameClick == 'save' || this.buttonNameClick == 'yes'){
                                    // SRA - ticket 860 
                                    refreshApex(result.data);
                                    this.dispatchEvent(new ShowToastEvent({title: 'Success', message: 'Signing Request saved successfully.', variant: 'success' }),);
                                    this.buttonNameClick = null;
                                    this.spinnerSigningRequest = false;
                                    this.setIdReq.clear(); // RRA 30/05/2022
                                }
                                else if(this.buttonNameClick == 'WrittenShareToSigned'){
                                    this.updateWrittenSignedShare();
                                    this.buttonNameClick = null;
                                    this.spinnerSigningRequest = false;
                                    this.setIdReq.clear(); // RRA 30/05/2022
                                }
                                else if(this.buttonNameClick == 'Send' || this.buttonNameClick == 'Update' || this.buttonNameClick == 'Remind'){
                                    this.checkRequestBeforeSendUpdateRemind(this.buttonNameClick);
                                    this.buttonNameClick = null;
                                }
                                else if(this.buttonNameClick == 'ReopenPreviousPhases'){
                                    let programStageValue =   this.selectedProgram + '-Placement';
                                    fireEvent(this.pageRef, 'updateStageName', programStageValue);
                                    this.reopenPreviousPhase();
                                }
                                else if(this.buttonNameClick == 'CloseSigningNotifyWebXL'){
                                    this.closeSigningNotifyWebXL();
                                    this.buttonNameClick = null;
                                }
                                else if(this.buttonNameClick == 'ReopenSigning'){
                                    this.reopenSigningRequest();
                                    this.buttonNameClick = null;
                                }
                                else{
                                }
                                //init flow CLM Sync
                                getAgreements({programId : this.selectedProgram})
                                .then(result => {
                                    console.log('CLM Results', result);
                                    //this.idAgreements = result; 
                                    //this.runSubflowsCLM = true;
                                    //:console.log('PRA this.runSubflowsCLM');
                                    //console.log(this.runSubflowsCLM);
                                });
                            }
                            this.lstIdReqOnChangeLossDeposit = []; //RRA - Ticket 1866 - 12012024
                        })
                        .catch(error => {
                            console.log('error==', error);
                            this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
                            this.spinnerSigningRequest = false;
                        });
                    })
                    .catch(error => {
                        this.error = error;
                    });
                    if(this.isPhaseChange == true){
                        fireEvent(this.pageRef, 'updateStageName', this.programStageValueChange);
                    }
                    this.isSave = false;
                }
                else{
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.FormEntriesInvalid, variant: 'error'}), );
                    this.spinnerSigningRequest = false;
                }
            }
            this.isValueChange = false;
            this.isOpenConfirmation = false;
            this.isPhaseChange = false;
        }

    handleOnClickWrittenSignedBtn(){
         this.buttonNameClick = 'WrittenShareToSigned';
        //RRA - 1397 - 06012023
        this.spinnerSigningRequest = true;
        if(this.isValueChange == true){
            this.isWrite = true;
            this.isOpenConfirmation = true;
            this.isAskToSave = true;
        }
        else{
            this.updateWrittenSignedShare();
        }
    }

    handleOpenSendUpdateRemindModal(event){
        this.buttonNameClick = event.currentTarget.name;
        this.btnNameSendUpdateRemind = event.currentTarget.name;
        if(this.isValueChange == true){
            this.isOpenConfirmation = true;
            this.isAskToSave = true;
            this.isSave = false;
        }
        else{
            this.checkRequestBeforeSendUpdateRemind(event.currentTarget.name);
        }
    }
    checkRequestBeforeSendUpdateRemind(btnNameClick){
        console.log('btnNameClick == ', btnNameClick);
        //let eventId = event.currentTarget.id;
        //let reqId = eventId.split('-')[0];
        let doesReqNotSentForRemind = false;
        let doesSelectedRequestHasSetup = false;
        this.spinnerSigningRequest = true;
        this.closePreviousBtnClick =  false; //RRA - ticket 1397 - 17012023
        let isAskValidation; //RRA - ticket 01411 - 03042023
        let isAskValidationbyDeputyCEO; //RRA - ticket 01411 - 03042023

        if(btnNameClick == 'Send'){
            this.lstSelectedSigningRequest = this.dataSigningRequest;
            //to send request for only status 'Setup'
            let lstSigningRequestSetup = [];

            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                isAskValidation = rowReq.isAskValidation__c;//RRA - ticket 01411 - 03042023
                isAskValidationbyDeputyCEO = rowReq.isAskValidateByDeputyCEO__c;//RRA - ticket 01411 - 03042023
                if(rowReq.ReinsurerStatus__c == 'Setup'){
                    lstSigningRequestSetup.push(rowReq);
                }
            }
            console.log('isAskValidation == ', isAskValidation);
            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                if(rowReq.ReinsurerStatus__c == 'Setup'){
                    lstSigningRequestSetup.push(rowReq);
                }
            }

            this.lstSelectedSigningRequest = lstSigningRequestSetup;
        }
        let selectedRequests = this.lstSelectedSigningRequest;
        let arr1 = [];

        for(var key in selectedRequests){
            let ele = selectedRequests[key];
            let obj = {};
            obj.Broker = ele.Broker__c;
            obj.Reinsurer = ele.Reinsurer__c;
            obj.brokerRein = ele.Broker__c+'-'+ele.Reinsurer__c;

            if(btnNameClick == 'Send' ||
               (btnNameClick == 'Update' && (ele.ReinsurerStatus__c == 'Sent' || ele.ReinsurerStatus__c == 'Timeout'))){
                arr1.push(obj);
            }
            else if(btnNameClick == 'Remind'){
                //You can't send a remind because at least one request is not 'Sent'
                if(ele.ReinsurerStatus__c != 'Sent'){
                    doesReqNotSentForRemind = true;
                }
                else{
                    arr1.push(obj);
                }
            }

            if(ele.ReinsurerStatus__c == 'Setup'){
                doesSelectedRequestHasSetup = true;
            }
        }

        if(btnNameClick == 'Send'){
            let requestHasNoSignedShareReq = false; //to check if all requests have signed share
            let mapLstRequestByTreatyId = new Map();
            let placementShareNotEqualtoSignedShare = false;
            let isFXrateExist = false;
            let lstIdReq = [];
            let lstRequestTreaty = [];

            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                let lstRequestByTreaty = [];
                if(rowReq.Treaty__c != null || rowReq.Treaty__c != undefined){
                    lstRequestTreaty.push(rowReq.Treaty__c)
                }
                if(rowReq.SignedShare__c == null || rowReq.SignedShare__c == undefined || Number.isNaN(rowReq.SignedShare__c) == true){
                    requestHasNoSignedShareReq = true;
                }
                if(mapLstRequestByTreatyId.has(rowReq.Treaty__c)){
                    lstRequestByTreaty = mapLstRequestByTreatyId.get(rowReq.Treaty__c);
                }
                lstRequestByTreaty.push(rowReq);
                mapLstRequestByTreatyId.set(rowReq.Treaty__c, lstRequestByTreaty);
            }
            for (let [key, value] of mapLstRequestByTreatyId) {
                let lstRequest = value;
                let totalSignedShare = 0;

                for(let i = 0; i < lstRequest.length; i++){
                    totalSignedShare = totalSignedShare + lstRequest[i].SignedShare__c;
                }
                totalSignedShare =  parseFloat(totalSignedShare).toFixed(6);
                if(lstRequest[0].Treaty__r.PlacementShare_Perc__c != totalSignedShare){
                    placementShareNotEqualtoSignedShare = true;
                }
            }
            //RRA - 1088
            checkFXRATEifExists({programId : this.selectedProgram, lstRequestTreatyId : lstRequestTreaty})
            .then(result => { 
                console.log('result== ', result);
                if (result != null){
                    isFXrateExist = true
                }else {
                    isFXrateExist;
                }

                console.log('isFXrateExist== ', isFXrateExist);
                if(arr1.length == 0){
                    this.dataSigningRequest = [];
                    this.getSigningDetails();
                    this.lstSelectedSigningRequest = [];
                    // No Signing Request with Reinsurer Status Setup is present
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.NoSigningRequestSetupPresent, variant: 'error',}), );
                }
                else if(isFXrateExist == false){
                    this.dataSigningRequest = [];
                    this.getSigningDetails();
                    this.lstSelectedSigningRequest = [];
                    // if fx rate don't exists
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.SigningRequestNoFXRate, variant: 'error',}), );
                }
                else if(requestHasNoSignedShareReq == true){
                    this.dataSigningRequest = [];
                    this.getSigningDetails();
                    this.lstSelectedSigningRequest = [];
                    // At least one Signing Request doesn't have a Signed Share yet
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.SigningRequestNoSignedShare, variant: 'error',}), );
                }
                else if(placementShareNotEqualtoSignedShare == true){
                    this.dataSigningRequest = [];
                    this.getSigningDetails();
                    this.lstSelectedSigningRequest = [];
                    // The total of Signed Share of at least one treaty is not matching the Placement Share
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.SignedShareNotMatchingPlacementS, variant: 'error',}), );
                }
                else if(this.allowAskForValidation == true && (isAskValidation == false || isAskValidation) && isAskValidationbyDeputyCEO == false){//RRA - ticket 1827 - 07122023
                    this.dataSigningRequest = [];
                    this.getSigningDetails();
                    this.lstSelectedSigningRequest = [];
                    // The Premium exceeds your authorization for signing, please click the 'Ask for Validation' button
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.Premium_exceeds_authorization_for_signing, variant: 'error',}), );
                }
                else if(this.contractualDocSigningPresent == false){
                    this.dataSigningRequest = [];
                    this.getSigningDetails();
                    this.lstSelectedSigningRequest = [];
                    // There is no contractual document attached, please add at least one
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.NoContractualDocumentAttached, variant: 'error',}), );
                }
                else{
                    this.isSendUpdateRemindSigningReqOpenModal = true;
                    this.titlePopUp = this.btnNameSendUpdateRemind + ' Signing Request(s)';
                    this.spinnerSigningRequest = false;
                }
            });
        }
        else{
            if(this.lstSelectedSigningRequest.length == 0){
                // No Signing Request is selected.
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.NoSigningRequestSelected, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else if(btnNameClick == 'Update' && doesSelectedRequestHasSetup == true){
                // You can't send an update because at least one request has never been sent.
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.SigningRequestStatusSetup, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else if(btnNameClick == 'Update' && arr1.length == 0){
                // No Signing Request with Reinsurer Status Sent or Timeout is selected.
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.NoSigningRequest_ReinsurerStatus_Sent_or_Timeout, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else if(btnNameClick == 'Remind' && doesReqNotSentForRemind == true){
                // You can't send a remind because at least one request is not 'Sent'.
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.CannotRemind_RequestNotSent, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else{
                this.isSendUpdateRemindSigningReqOpenModal = true;
                this.lstSelectedSigningRequest1 =  arr1;
                this.titlePopUp = this.btnNameSendUpdateRemind + ' Signing Request(s)';
                this.spinnerSigningRequest = false;
            }
        }
        this.buttonNameClick = '';
    }

sendUpdateRemindSigningRequest(btnName){
        let arr1 = [];
        this.lstSelectedSigningRequest = this.dataSigningRequest;
        let selectedRequests = this.lstSelectedSigningRequest;

        for(var key in selectedRequests){
           let ele = selectedRequests[key];
           let obj = {};
           obj.Broker = ele.Broker__c;
           obj.Reinsurer = ele.Reinsurer__c;
           obj.brokerRein = ele.Broker__c+'-'+ele.Reinsurer__c;
           arr1.push(obj);
        }

        if(btnName == 'Send'){
            let requestHasNoSignedShareReq = false; //to check if all request has sign share
            let mapLstRequestByTreatyId = new Map();
            let placementShareNotEqualtoSignedShare = false;

            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                let lstRequestByTreaty = [];

                if(rowReq.SignedShare__c == null || rowReq.SignedShare__c == undefined || Number.isNaN(rowReq.SignedShare__c) == true){
                    requestHasNoSignedShareReq = true;
                }

                if(mapLstRequestByTreatyId.has(rowReq.Treaty__c)){
                    lstRequestByTreaty = mapLstRequestByTreatyId.get(rowReq.Treaty__c);
                }

                lstRequestByTreaty.push(rowReq);
                mapLstRequestByTreatyId.set(rowReq.Treaty__c, lstRequestByTreaty);
            }

            for (let [key, value] of mapLstRequestByTreatyId) {
                let lstRequest = value;
                let totalSignedShare = 0;

                for(let i = 0; i < lstRequest.length; i++){
                    totalSignedShare = totalSignedShare + lstRequest[i].SignedShare__c;
                }

                totalSignedShare =  parseFloat(totalSignedShare).toFixed(6);

                if(lstRequest[0].Treaty__r.PlacementShare_Perc__c != totalSignedShare){
                    placementShareNotEqualtoSignedShare = true;
                }
            }

            //When clicking on Send button in Signing phase, do the following checks:
            
            if(requestHasNoSignedShareReq == true){
                // At least one Signing Request doesn't have a Signed Share yet
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.SigningRequestNoSignedShare, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else if(placementShareNotEqualtoSignedShare == true){
                // The total of Signed Share of at least one treaty is not matching the Placement Share
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.SignedShareNotMatchingPlacementS, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else if(this.allowAskForValidation == true){
                // The Premium exceeds your authorization for signing, please click the 'Ask for Validation' button
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.Premium_exceeds_authorization_for_signing, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else if(this.contractualDocSigningPresent == false){
                // There is no contractual document attached, please add at least one
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.NoContractualDocumentAttached, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else{
                this.isSendUpdateRemindSigningReqOpenModal = true;
                this.lstSelectedSigningRequest1 =  arr1;
                this.titlePopUp = this.btnNameSendUpdateRemind + ' Signing Request(s)';
            }
        }
        else{
            this.isSendUpdateRemindSigningReqOpenModal = true;
            this.lstSelectedSigningRequest1 =  arr1;
            this.isAskToSave = false;
        }
    }

    closeSendUpdateRemindReqModal(val){
        this.isSendUpdateRemindSigningReqOpenModal = false;
        this.lstSelectedSigningRequest = [];
        this.send = false;
        this.update = false;
        this.isAskToSave = false;
        this.dataSigningRequest = [];

        //AMI 01/07/22 W:0947
        //reset global select/deselect on close
        if (this.template.querySelector('[data-id="gToggle"]') !== undefined && this.template.querySelector('[data-id="gToggle"]') !== null) {//MRA W-1233
            this.template.querySelector('[data-id="gToggle"]').checked = false;
        }
        this.getSigningDetails();
    }

    handleCloseSendUpdateRemindModal(){
        this.isSendUpdateRemindSigningReqOpenModal = false; 
        this.lstSelectedSigningRequest = [];
        this.send = false;
        this.update = false;
        this.isAskToSave = false;
        this.dataSigningRequest = [];

        //MRA 08/08/22 W:0947
        //reset global select/deselect on close
        if (this.template.querySelector('[data-id="gToggle"]') !== undefined && this.template.querySelector('[data-id="gToggle"]') !== null)//MRA W-1233
        this.template.querySelector('[data-id="gToggle"]').checked = false;

        this.getSigningDetails();
    }

    handleOnClickValidationBtn(){
        let isAskValidation;
        if(this.allowAskForValidation == true){
            // MRA W-1263 - Ask for validation - At least one contractual document : START
            if(this.contractualDocSigningPresent == false){
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.NoContractualDocumentAttached, variant: 'error',}), );
                this.spinnerSigningRequest = false;
            }
            else{
                //RRA - ticket 01411 - 03042023
                for (let i=0;i<this.dataSigningRequest.length;i++){
                    let rowReq = {...this.dataSigningRequest[i]};
                    if (rowReq.isAskValidation__c){
                        isAskValidation = true;
                    }
                }

                if (isAskValidation){
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.askValidationImpossible, variant: 'error',}), );
                }else{
                    this.isOpenConfirmation = true;
                    this.isValidate = true;
                    this.closePreviousBtnClick ==  false;//RRA - ticket 1397 - 17012023
                }
            }
        }
        else{
            this.dispatchEvent(new ShowToastEvent({message: this.label.NoNeedToAskForValidation, variant: 'Info' }),);
        }
    }
         
    handleOnClickCloseSigningNotifyWebXLBtn(){
        if(this.isValueChange == true){
            this.isOpenConfirmation = true;
            this.isSave = false;
            this.isAskToSave = true;
        }
        else{
            this.closeSigningNotifyWebXL();
        }
    }

    closeSigningNotifyWebXL(){
        let lstSigningReqId = [];
        let canClose = true;
        this.closePreviousBtnClick =  false; //RRA - ticket 1397 - 17012023

        for(let i = 0; i < this.dataSigningRequest.length; i++){
            //MBE - 16/09
            if(((this.dataSigningRequest[i].Broker__c != null && this.dataSigningRequest[i].Broker__c != undefined && this.dataSigningRequest[i].Broker__c != 'undefined' && this.dataSigningRequest[i].Broker__c != 'null')
              && (this.dataSigningRequest[i].BrokerStatus__c == null || this.dataSigningRequest[i].BrokerStatus__c == undefined || this.dataSigningRequest[i].BrokerStatus__c == 'undefined' || this.dataSigningRequest[i].BrokerStatus__c == 'null'
              || this.dataSigningRequest[i].RetrocessionBrokerage__c == null || this.dataSigningRequest[i].RetrocessionBrokerage__c == undefined || (Number.isNaN(this.dataSigningRequest[i].RetrocessionBrokerage__c) == true)))
              || (this.dataSigningRequest.isRequestPool == false && (this.dataSigningRequest[i].RiskCarrier__c == null || this.dataSigningRequest[i].RiskCarrier__c == undefined
              || this.dataSigningRequest[i].FinancialEntity__c == null || this.dataSigningRequest[i].FinancialEntity__c == undefined))){
                canClose = false;
            }
            // RRA - 869
            if (this.dataSigningRequest[i].SigningStatus__c = '4') {
                canClose = true;
            }

            lstSigningReqId.push(this.dataSigningRequest[i].Id);
            console.log('this.dataSigningRequest[i] ', this.dataSigningRequest[i]);
        }
       

        if(canClose == false){
            this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.CloseSigningErrorMsg, variant: 'error'}), );
            this.spinnerSigningRequest = false;
        }
        else if (canClose == true) {
            closeSigningNotifyWebXL({ programId : this.selectedProgram, lstSigningRequestId : lstSigningReqId })
            .then(result => {
                if(result.hasOwnProperty('Error') && result.Error){
                    this.dispatchEvent(new ShowToastEvent({title: 'Error', message: result.Error, variant: 'error' }),);
                    this.spinnerSigningRequest = false;
                }
                else{
                     this.dispatchEvent(new ShowToastEvent({title: 'Success', message: this.label.emailSent, variant: 'success' }),);
                     this.buttonNameClick = null;
                     this.disableThisButton = true; // RRA - 869 grisage du bouton Close Signing & Notify WebXL
                }
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
                this.spinnerSigningRequest = false;
            });
        }
    }

    handleOnClickDeleteBtn(){
        this.isDelete = true;
        this.isOpenConfirmation = true;
        this.closePreviousBtnClick =  false; //RRA - ticket 1397 - 17012023
    }

    handleOnClickReopenBtn(event){
        if(this.lstSelectedSigningReqId.length > 0){
            this.buttonNameClick = event.currentTarget.name;
            if(this.isValueChange == true){
                this.isReopen = true;
                this.isOpenConfirmation = true;
                this.isSave = false;
                this.isAskToSave = true;
            }
            else{
                this.reopenSigningRequest();
            }
        }
        else{
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: this.label.requestSelected, variant: 'error',}),);
        }
    }

    reopenSigningRequest(){
        this.closePreviousBtnClick =  false; //RRA - ticket 1397 - 17012023
        reopenSigningRequest({ lstSigningRequestId : this.lstSelectedSigningReqId })
        .then(result => {
            if(result.hasOwnProperty('Error') && result.Error){
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: result.Error, variant: 'error' }),);
                this.spinnerSigningRequest = false;
            }
            else{
                 this.dispatchEvent(new ShowToastEvent({title: 'Success', message: this.label.requestReopened, variant: 'success' }),);
            }
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
            this.spinnerSigningRequest = false;
        });
    }

    handleOnClickSignForPoolBtn(event){
        this.buttonNameClick = event.currentTarget.name;
        if(this.isValueChange == true){
            this.isSign = true;
            this.isOpenConfirmation = true;
            this.isAskToSave = true;
        }
        else{
            this.isOpenSignForPoolModal = true;
            this.closePreviousBtnClick =  false; //RRA - ticket 1397 - 17012023
        }
    }

    handleCloseSignForPoolModal(){
        this.isOpenSignForPoolModal = false;
        this.closePreviousBtnClick ==  false;
    }

    handleReopenPreviousPhases(event){
        this.buttonNameClick = event.currentTarget.name;
        if(this.isValueChange == true){
            this.isOpenConfirmation = true;
            this.isAskToSave = true;
        }
        else{
            let programStageValue =   this.selectedProgram + '-Placement';
            fireEvent(this.pageRef, 'updateStageName', programStageValue);
            this.reopenPreviousPhase();
        }
    }

    reopenPreviousPhase(){
        this.closePreviousBtnClick ==  false;
        reopenPreviousPhase({programId : this.selectedProgram})
        .then(result => {
            if(result.hasOwnProperty('Error') && result.Error){
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: result.Error, variant: 'error' }),);
                this.spinnerSigningRequest = false;
            }
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
            this.spinnerSigningRequest = false;
        });
    }

    handleCloseConfirmationModal(){
        if(this.isPhaseChange == true){
            fireEvent(this.pageRef, 'updateStageName', this.programStageValueChange);
        }

        if(this.buttonNameClick == 'WrittenShareToSigned'){
            this.updateWrittenSignedShare();
            this.isValueChange = false;
        }
        else if(this.buttonNameClick == 'Send' || this.buttonNameClick == 'Update' || this.buttonNameClick == 'Remind'){
            this.checkRequestBeforeSendUpdateRemind(this.buttonNameClick);
        }
        else if(this.buttonNameClick == 'ReopenPreviousPhases'){
            let programStageValue =   this.selectedProgram + '-Placement';
            fireEvent(this.pageRef, 'updateStageName', programStageValue);
            this.reopenPreviousPhase();
        }
        else if(this.buttonNameClick == 'CloseSigningNotifyWebXL'){
            this.closeSigningNotifyWebXL();
        }
        else if(this.buttonNameClick == 'ReopenSigning'){
            this.reopenSigningRequest();
        }

        this.isOpenConfirmation = false;
        this.isPhaseChange = false;
        this.buttonNameClick = null;
        this.buttonSignPoolVisibility;
        this.isSave = false;
        this.isWrite = false;
        this.isValidate = false;
        this.isClose = false;
        this.isDelete = false;
        this.isReopen = false;
        this.isSign = false;
        this.isAskToSave = false;
    }

    askSaveConfirmation(val){
        this.programStageValueChange = val;
        this.isPhaseChange = true;

        if(this.isValueChange == true){
            this.isOpenConfirmation = true;
            this.isAskToSave = true;
        }
        else{
            fireEvent(this.pageRef, 'updateStageName', val);
        }
    }

    updateWrittenSignedShare(){
        let updDataSigningRequest = [];
        this.spinnerSigningRequest = true;
        this.closePreviousBtnClick =  false; //RRA - ticket 1397 - 17012023

        for(let i = 0; i < this.dataSigningRequest.length; i++){
            let rowReq = { ...this.dataSigningRequest[i] };
            if(rowReq.WrittenShare__c != undefined){
                rowReq['SignedShare__c'] = rowReq.WrittenShare__c;
            }
            updDataSigningRequest.push(rowReq);
        }

        this.dataSigningRequest = [ ...updDataSigningRequest ];
        this.sortData('TECH_Layer__c', 'TECH_TreatyName__c', 'ReinsurerOrPoolName', 'asc');

        updateWrittenSignedShare({ lstRequest : this.dataSigningRequest })
        .then(result => {
            if(result.hasOwnProperty('Error') && result.Error){
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: result.Error, variant: 'error' }),);
                this.spinnerSigningRequest = false;
            }
            else{
                this.dispatchEvent(new ShowToastEvent({title: 'Success', message: this.label.writtenShare, variant: 'success' }),);
            }

            this.dataSigningRequest = [];

            this.getSigningDetails();
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
        });
    }

    handleDeleteRequests(){
        this.spinnerSigningRequest = true;
        deleteSigningRequests({programId : this.selectedProgram})
        .then(result => {
            if(result.hasOwnProperty('Error') && result.Error){
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: result.Error, variant: 'error' }),);
                this.spinnerSigningRequest = false;
            }
            else{
                this.spinnerSigningRequest = false;
                this.dispatchEvent(new ShowToastEvent({title: 'Success', message: this.label.requestDeleted, variant: 'success'  }),);
                window.location.href = '../n/TreatyPlacement?c__program='+this.selectedProgram+'-'+this.valueUWYear+'-'+this.principalCedYear+'-Placement-'+this.selectedTreaty+'-'+this.selectedBroker+'-'+this.selectedReinsurer+'-'+this.selectedReinsurerStatus;
            }
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
            this.spinnerSigningRequest = false;
        })
    }

    sortData(fieldName, fieldName2, fieldName3, sortDirection) {
        let sortResult = Object.assign([], this.dataSigningRequest);
        this.dataSigningRequest = sortResult.sort(function(a,b){
            if(a[fieldName] < b[fieldName])
                return sortDirection === 'asc' ? -1 : 1;
            else if(a[fieldName] > b[fieldName])
                return sortDirection === 'asc' ? 1 : -1;
            else{
                if(a[fieldName2] < b[fieldName2])
                    return sortDirection === 'asc' ? -1 : 1;
                else if(a[fieldName2] > b[fieldName2])
                    return sortDirection === 'asc' ? 1 : -1;
                else{
                    if(a[fieldName3] < b[fieldName3])
                        return sortDirection === 'asc' ? -1 : 1;
                    else if(a[fieldName3] > b[fieldName3])
                        return sortDirection === 'asc' ? 1 : -1;
                    else
                        return 0;
                }
            }
        })

        let mapDisplayRowByTreaty = new Map();

        for(let i = 0; i < this.dataSigningRequest.length;i++){
            if(this.dataSigningRequest[i].displayInTable == true){
                mapDisplayRowByTreaty.set(this.dataSigningRequest[i].Treaty__c, this.dataSigningRequest[i].Id);
            }
        }

        for(let i = 0; i < this.dataSigningRequest.length;i++){          
            this.dataSigningRequest[i]['displayTotalSumRow'] = false;

            if(mapDisplayRowByTreaty.has(this.dataSigningRequest[i].Treaty__c) == true){
                if(mapDisplayRowByTreaty.get(this.dataSigningRequest[i].Treaty__c) == this.dataSigningRequest[i].Id){
                    this.dataSigningRequest[i]['displayTotalSumRow'] = true;
                }
            }
        }
    }

    handleReinsurerNameSelected(event){
        this.selectedRequest = event.target.dataset.id;
        this.marketSubVisible = true;
    }

    handleCloseMarketSubModal(){
        this.marketSubVisible = false;
        this.getSigningDetails();
    }

    checkIfProgPhaseSigningHasDoc(){
        checkIfProgPhaseSigningHasDoc({programId : this.selectedProgram})
        .then(result => {
            if(result.hasOwnProperty('Error') && result.Error){
                this.dispatchEvent(new ShowToastEvent({title: 'Error', message: result.Error, variant: 'error' }),);
                this.spinnerSigningRequest = false;
            }
            else{
            }
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({title: 'Error', message: this.label.errorMsg, variant: 'error'}), );
            this.spinnerSigningRequest = false;
        })
    }

    updateRequestReinsurer(val){
        let reinsurerId = val.split('-')[0];
        let recId = val.split('-')[1];
        let selectName = val.split('-')[2];
        let type = val.split('-')[3];
        let lstUpdDataSigningRequest = [];

        if(type == 'Risk'){
            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                if(rowReq['Reinsurer__c'] == reinsurerId){
                    rowReq['RiskCarrier__c'] = recId;
                    rowReq['RiskCarrierName'] = selectName;
                }
                lstUpdDataSigningRequest.push(rowReq);
            }

        }
        else{
            for(let i = 0; i < this.dataSigningRequest.length; i++){
                let rowReq = { ...this.dataSigningRequest[i] };
                if(rowReq['Reinsurer__c'] == reinsurerId){
                    rowReq['FinancialEntity__c'] = recId;
                    rowReq['FinancialName'] = selectName;
                }
                lstUpdDataSigningRequest.push(rowReq);
            }
        }
        this.dataSigningRequest = lstUpdDataSigningRequest;
    }
}