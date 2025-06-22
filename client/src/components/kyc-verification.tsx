
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  User, 
  Phone,
  MapPin,
  CreditCard,
  Shield
} from "lucide-react";
import { KYCProgressIndicator } from "@/components/kyc-progress-indicator";

interface KYCVerificationProps {
  onComplete?: () => void;
}

type KYCStep = 'personal' | 'address' | 'identity' | 'verification' | 'complete';

export function KYCVerification({ onComplete }: KYCVerificationProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<KYCStep>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: user?.phone || '',
    email: user?.email || ''
  });

  const [addressInfo, setAddressInfo] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
    residentialType: ''
  });

  const [identityInfo, setIdentityInfo] = useState({
    idType: '',
    idNumber: '',
    bvn: user?.bvn || '',
    nin: ''
  });

  const [documents, setDocuments] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
    proofOfAddress: null as File | null
  });

  const steps: { key: KYCStep; title: string; description: string; icon: any }[] = [
    {
      key: 'personal',
      title: 'Personal Information',
      description: 'Basic personal details',
      icon: User
    },
    {
      key: 'address',
      title: 'Address Information',
      description: 'Residential address details',
      icon: MapPin
    },
    {
      key: 'identity',
      title: 'Identity Verification',
      description: 'Government ID and BVN',
      icon: CreditCard
    },
    {
      key: 'verification',
      title: 'Document Upload',
      description: 'Upload required documents',
      icon: Upload
    },
    {
      key: 'complete',
      title: 'Verification Complete',
      description: 'KYC submission successful',
      icon: CheckCircle
    }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.key === currentStep);
  const getProgressPercentage = () => ((getCurrentStepIndex() + 1) / steps.length) * 100;

  const handleFileUpload = (field: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setDocuments(prev => ({ ...prev, [field]: file }));
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'personal':
        return !!(personalInfo.firstName && personalInfo.lastName && personalInfo.dateOfBirth && personalInfo.gender);
      case 'address':
        return !!(addressInfo.street && addressInfo.city && addressInfo.state);
      case 'identity':
        return !!(identityInfo.idType && identityInfo.idNumber && identityInfo.bvn);
      case 'verification':
        return !!(documents.idFront && documents.selfie);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const submitKYC = async () => {
    setIsSubmitting(true);
    try {
      // First, submit the KYC data
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('digipay_token')}`
        },
        body: JSON.stringify({
          ...personalInfo,
          ...addressInfo,
          ...identityInfo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit KYC data');
      }

      // Then upload documents if any exist
      if (documents.idFront || documents.idBack || documents.selfie || documents.proofOfAddress) {
        const formData = new FormData();
        
        Object.entries(documents).forEach(([key, file]) => {
          if (file) {
            formData.append(key, file);
          }
        });

        const uploadResponse = await fetch('/api/kyc/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('digipay_token')}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload documents');
        }
      }

      setCurrentStep('complete');
      
      toast({
        title: "KYC Submitted Successfully",
        description: "Your verification is being processed. You'll be notified within 24-48 hours.",
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonalInfoStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={personalInfo.firstName}
            onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder="Enter your first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={personalInfo.lastName}
            onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder="Enter your last name"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="middleName">Middle Name</Label>
        <Input
          id="middleName"
          value={personalInfo.middleName}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, middleName: e.target.value }))}
          placeholder="Enter your middle name (optional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={personalInfo.dateOfBirth}
            onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select value={personalInfo.gender} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, gender: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            value={personalInfo.phoneNumber}
            onChange={(e) => setPersonalInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="Your phone number"
            disabled
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={personalInfo.email}
            onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Your email address"
            disabled
          />
        </div>
      </div>
    </div>
  );

  const renderAddressInfoStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="street">Street Address *</Label>
        <Input
          id="street"
          value={addressInfo.street}
          onChange={(e) => setAddressInfo(prev => ({ ...prev, street: e.target.value }))}
          placeholder="Enter your street address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={addressInfo.city}
            onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Enter your city"
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Select value={addressInfo.state} onValueChange={(value) => setAddressInfo(prev => ({ ...prev, state: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abia">Abia</SelectItem>
              <SelectItem value="adamawa">Adamawa</SelectItem>
              <SelectItem value="akwa-ibom">Akwa Ibom</SelectItem>
              <SelectItem value="anambra">Anambra</SelectItem>
              <SelectItem value="bauchi">Bauchi</SelectItem>
              <SelectItem value="bayelsa">Bayelsa</SelectItem>
              <SelectItem value="benue">Benue</SelectItem>
              <SelectItem value="borno">Borno</SelectItem>
              <SelectItem value="cross-river">Cross River</SelectItem>
              <SelectItem value="delta">Delta</SelectItem>
              <SelectItem value="ebonyi">Ebonyi</SelectItem>
              <SelectItem value="edo">Edo</SelectItem>
              <SelectItem value="ekiti">Ekiti</SelectItem>
              <SelectItem value="enugu">Enugu</SelectItem>
              <SelectItem value="fct">Federal Capital Territory</SelectItem>
              <SelectItem value="gombe">Gombe</SelectItem>
              <SelectItem value="imo">Imo</SelectItem>
              <SelectItem value="jigawa">Jigawa</SelectItem>
              <SelectItem value="kaduna">Kaduna</SelectItem>
              <SelectItem value="kano">Kano</SelectItem>
              <SelectItem value="katsina">Katsina</SelectItem>
              <SelectItem value="kebbi">Kebbi</SelectItem>
              <SelectItem value="kogi">Kogi</SelectItem>
              <SelectItem value="kwara">Kwara</SelectItem>
              <SelectItem value="lagos">Lagos</SelectItem>
              <SelectItem value="nasarawa">Nasarawa</SelectItem>
              <SelectItem value="niger">Niger</SelectItem>
              <SelectItem value="ogun">Ogun</SelectItem>
              <SelectItem value="ondo">Ondo</SelectItem>
              <SelectItem value="osun">Osun</SelectItem>
              <SelectItem value="oyo">Oyo</SelectItem>
              <SelectItem value="plateau">Plateau</SelectItem>
              <SelectItem value="rivers">Rivers</SelectItem>
              <SelectItem value="sokoto">Sokoto</SelectItem>
              <SelectItem value="taraba">Taraba</SelectItem>
              <SelectItem value="yobe">Yobe</SelectItem>
              <SelectItem value="zamfara">Zamfara</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            value={addressInfo.postalCode}
            onChange={(e) => setAddressInfo(prev => ({ ...prev, postalCode: e.target.value }))}
            placeholder="Enter postal code"
          />
        </div>
        <div>
          <Label htmlFor="residentialType">Residential Type</Label>
          <Select value={addressInfo.residentialType} onValueChange={(value) => setAddressInfo(prev => ({ ...prev, residentialType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owned">Owned</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
              <SelectItem value="family">Family House</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderIdentityStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="idType">ID Type *</Label>
          <Select value={identityInfo.idType} onValueChange={(value) => setIdentityInfo(prev => ({ ...prev, idType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nin">National Identity Number (NIN)</SelectItem>
              <SelectItem value="drivers-license">Driver's License</SelectItem>
              <SelectItem value="international-passport">International Passport</SelectItem>
              <SelectItem value="voters-card">Voter's Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="idNumber">ID Number *</Label>
          <Input
            id="idNumber"
            value={identityInfo.idNumber}
            onChange={(e) => setIdentityInfo(prev => ({ ...prev, idNumber: e.target.value }))}
            placeholder="Enter your ID number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bvn">Bank Verification Number (BVN) *</Label>
          <Input
            id="bvn"
            value={identityInfo.bvn}
            onChange={(e) => setIdentityInfo(prev => ({ ...prev, bvn: e.target.value }))}
            placeholder="Enter your BVN"
            maxLength={11}
          />
        </div>
        <div>
          <Label htmlFor="nin">National Identity Number (NIN)</Label>
          <Input
            id="nin"
            value={identityInfo.nin}
            onChange={(e) => setIdentityInfo(prev => ({ ...prev, nin: e.target.value }))}
            placeholder="Enter your NIN (optional)"
            maxLength={11}
          />
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your BVN and NIN are used for identity verification and are stored securely. 
          We comply with all Nigerian data protection regulations.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderDocumentUploadStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ID Front */}
        <div className="space-y-2">
          <Label>ID Document (Front) *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {documents.idFront ? (
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-sm text-gray-600">{documents.idFront.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Upload front of your ID</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('idFront', e.target.files[0])}
              className="hidden"
              id="idFront"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById('idFront')?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>

        {/* ID Back */}
        <div className="space-y-2">
          <Label>ID Document (Back)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {documents.idBack ? (
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-sm text-gray-600">{documents.idBack.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Upload back of your ID</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('idBack', e.target.files[0])}
              className="hidden"
              id="idBack"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById('idBack')?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>

        {/* Selfie */}
        <div className="space-y-2">
          <Label>Selfie with ID *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {documents.selfie ? (
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-sm text-gray-600">{documents.selfie.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Upload selfie holding your ID</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
              className="hidden"
              id="selfie"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById('selfie')?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>

        {/* Proof of Address */}
        <div className="space-y-2">
          <Label>Proof of Address</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {documents.proofOfAddress ? (
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-sm text-gray-600">{documents.proofOfAddress.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Upload utility bill or bank statement</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('proofOfAddress', e.target.files[0])}
              className="hidden"
              id="proofOfAddress"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById('proofOfAddress')?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please ensure all documents are clear and readable. Accepted formats: JPG, PNG, PDF (max 5MB each).
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900">KYC Submitted Successfully!</h3>
        <p className="text-gray-600 mt-2">
          Your verification documents have been submitted and are being reviewed by our team.
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 space-y-1 text-left">
          <li>• Our team will review your documents within 24-48 hours</li>
          <li>• You'll receive an email notification once verification is complete</li>
          <li>• Your trading limits will be increased automatically</li>
          <li>• You'll gain access to advanced trading features</li>
        </ul>
      </div>

      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Verification Pending
      </Badge>
    </div>
  );

  if (user?.kycVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            KYC Verified
          </CardTitle>
          <CardDescription>
            Your account is fully verified and ready for trading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Verified
            </Badge>
            <span className="text-sm text-gray-600">
              Verified on {new Date().toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Verification</CardTitle>
        <CardDescription>
          Complete your identity verification to unlock full trading features
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <Progress value={getProgressPercentage()} />
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < getCurrentStepIndex();
            const isCurrent = index === getCurrentStepIndex();
            
            return (
              <div key={step.key} className="flex flex-col items-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${isCompleted ? 'bg-green-100 border-green-500 text-green-600' : 
                    isCurrent ? 'bg-blue-100 border-blue-500 text-blue-600' : 
                    'bg-gray-100 border-gray-300 text-gray-400'}`}>
                  <StepIcon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 'personal' && renderPersonalInfoStep()}
          {currentStep === 'address' && renderAddressInfoStep()}
          {currentStep === 'identity' && renderIdentityStep()}
          {currentStep === 'verification' && renderDocumentUploadStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'complete' && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={getCurrentStepIndex() === 0}
            >
              Previous
            </Button>

            {currentStep === 'verification' ? (
              <Button
                onClick={submitKYC}
                disabled={isSubmitting || !validateCurrentStep()}
              >
                {isSubmitting ? "Submitting..." : "Submit KYC"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!validateCurrentStep()}
              >
                Next
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
