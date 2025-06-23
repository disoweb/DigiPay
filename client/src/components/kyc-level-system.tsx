import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Upload, 
  Star,
  DollarSign,
  TrendingUp,
  User,
  MapPin,
  FileText,
  Briefcase,
  AlertTriangle
} from "lucide-react";

interface KYCLevel {
  level: number;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requirements: string[];
  benefits: string[];
  dailyLimit: string;
  monthlyLimit: string;
}

const KYC_LEVELS: Omit<KYCLevel, 'status'>[] = [
  {
    level: 1,
    title: "Basic Verification",
    description: "Essential personal information and basic verification",
    requirements: [
      "Full name and date of birth",
      "Phone number verification",
      "Basic selfie photo"
    ],
    benefits: [
      "Access to basic trading",
      "Send/receive up to ₦50,000 daily",
      "Limited wallet features"
    ],
    dailyLimit: "50000",
    monthlyLimit: "500000"
  },
  {
    level: 2,
    title: "Standard Verification",
    description: "Identity document verification and address confirmation",
    requirements: [
      "Government-issued ID (NIN, Driver's License, Passport)",
      "Proof of address (utility bill, bank statement)",
      "Enhanced identity verification"
    ],
    benefits: [
      "Increased trading limits",
      "Send/receive up to ₦500,000 daily",
      "Access to advanced trading features",
      "Priority customer support"
    ],
    dailyLimit: "500000",
    monthlyLimit: "5000000"
  },
  {
    level: 3,
    title: "Premium Verification",
    description: "Enhanced due diligence for high-value transactions",
    requirements: [
      "Source of funds verification",
      "Employment/income documentation",
      "Bank statements (3 months)",
      "Enhanced background checks"
    ],
    benefits: [
      "Unlimited trading",
      "Send/receive up to ₦5,000,000 daily",
      "VIP customer support",
      "Access to institutional features",
      "Lower trading fees"
    ],
    dailyLimit: "5000000",
    monthlyLimit: "50000000"
  }
];

export function KYCLevelSystem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [files, setFiles] = useState<{ [key: string]: File }>({});

  const { data: kycData, isLoading } = useQuery({
    queryKey: ["/api/kyc/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/kyc/status");
      if (!response.ok) throw new Error("Failed to fetch KYC data");
      return response.json();
    },
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user");
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
  });

  const submitLevel1Mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/kyc/level1/submit", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit Level 1 KYC");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Level 1 KYC submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitLevel2Mutation = useMutation({
    mutationFn: async (formDataToSubmit: FormData) => {
      const response = await fetch("/api/kyc/level2/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataToSubmit,
      });
      if (!response.ok) throw new Error("Failed to submit Level 2 KYC");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Level 2 KYC submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitLevel3Mutation = useMutation({
    mutationFn: async (formDataToSubmit: FormData) => {
      const response = await fetch("/api/kyc/level3/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataToSubmit,
      });
      if (!response.ok) throw new Error("Failed to submit Level 3 KYC");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Level 3 KYC submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCurrentKYCLevel = () => {
    if (!user) return 0;
    return user.kycLevel || 0;
  };

  const getKYCStatus = (level: number) => {
    if (!kycData) return 'pending';
    
    switch (level) {
      case 1:
        return kycData.level1Status || 'pending';
      case 2:
        return kycData.level2Status || 'pending';
      case 3:
        return kycData.level3Status || 'pending';
      default:
        return 'pending';
    }
  };

  const canAccessLevel = (level: number) => {
    const currentLevel = getCurrentKYCLevel();
    if (level === 1) return true;
    if (level === 2) return currentLevel >= 1 && getKYCStatus(1) === 'approved';
    if (level === 3) return currentLevel >= 2 && getKYCStatus(2) === 'approved';
    return false;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleFileChange = (key: string, file: File) => {
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleLevel1Submit = () => {
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitLevel1Mutation.mutate(formData);
  };

  const handleLevel2Submit = () => {
    const formDataToSubmit = new FormData();
    
    // Add form data
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        formDataToSubmit.append(key, formData[key]);
      }
    });

    // Add files
    Object.keys(files).forEach(key => {
      if (files[key]) {
        formDataToSubmit.append(key, files[key]);
      }
    });

    if (!files.idFront || !files.selfie) {
      toast({
        title: "Missing documents",
        description: "Please upload all required documents",
        variant: "destructive",
      });
      return;
    }

    submitLevel2Mutation.mutate(formDataToSubmit);
  };

  const handleLevel3Submit = () => {
    const formDataToSubmit = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        formDataToSubmit.append(key, formData[key]);
      }
    });

    Object.keys(files).forEach(key => {
      if (files[key]) {
        formDataToSubmit.append(key, files[key]);
      }
    });

    if (!formData.sourceOfFunds || !formData.employmentStatus || !files.proofOfIncome) {
      toast({
        title: "Missing information",
        description: "Please provide all required information and documents",
        variant: "destructive",
      });
      return;
    }

    submitLevel3Mutation.mutate(formDataToSubmit);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentLevel = getCurrentKYCLevel();
  const progressPercentage = (currentLevel / 3) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KYC Verification Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Level: {currentLevel}/3</span>
              <span className="text-2xl font-bold text-blue-600">Level {currentLevel}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold">Daily Limit</div>
                <div className="text-green-600">
                  ₦{parseInt(KYC_LEVELS[Math.max(0, currentLevel - 1)]?.dailyLimit || "0").toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">Monthly Limit</div>
                <div className="text-green-600">
                  ₦{parseInt(KYC_LEVELS[Math.max(0, currentLevel - 1)]?.monthlyLimit || "0").toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">Status</div>
                <div className="flex justify-center">
                  {getStatusBadge(user?.kycStatus || 'not_started')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Levels */}
      {KYC_LEVELS.map((levelInfo, index) => {
        const level = levelInfo.level;
        const status = getKYCStatus(level);
        const canAccess = canAccessLevel(level);
        const isActive = level === currentLevel + 1;

        return (
          <Card key={level} className={`${
            status === 'approved' ? 'border-green-200 bg-green-50' : 
            isActive ? 'border-blue-200 bg-blue-50' : 
            'border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <h3 className="text-lg font-semibold">{levelInfo.title}</h3>
                    <p className="text-sm text-gray-600">{levelInfo.description}</p>
                  </div>
                </div>
                {getStatusBadge(status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Requirements
                  </h4>
                  <ul className="space-y-2">
                    {levelInfo.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Benefits
                  </h4>
                  <ul className="space-y-2">
                    {levelInfo.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                {status === 'approved' && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                
                {status === 'pending' && level <= currentLevel && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Under Review
                  </Badge>
                )}

                {status === 'rejected' && (
                  <div className="flex gap-2">
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentStep(level)}
                      disabled={!canAccess}
                    >
                      Resubmit
                    </Button>
                  </div>
                )}

                {canAccess && status !== 'approved' && status !== 'pending' && (
                  <Button
                    onClick={() => setCurrentStep(level)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {status === 'rejected' ? 'Resubmit' : 'Start Verification'}
                  </Button>
                )}

                {!canAccess && status !== 'approved' && (
                  <Button disabled variant="outline">
                    Complete Previous Level First
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* KYC Forms Modal/Steps would be rendered here based on currentStep */}
      {currentStep > 0 && (
        <KYCStepForm
          step={currentStep}
          onClose={() => setCurrentStep(0)}
          formData={formData}
          setFormData={setFormData}
          files={files}
          onFileChange={handleFileChange}
          onSubmitLevel1={handleLevel1Submit}
          onSubmitLevel2={handleLevel2Submit}
          onSubmitLevel3={handleLevel3Submit}
          isSubmitting={
            submitLevel1Mutation.isPending || 
            submitLevel2Mutation.isPending || 
            submitLevel3Mutation.isPending
          }
        />
      )}
    </div>
  );
}

// KYC Step Form Component
interface KYCStepFormProps {
  step: number;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  files: { [key: string]: File };
  onFileChange: (key: string, file: File) => void;
  onSubmitLevel1: () => void;
  onSubmitLevel2: () => void;
  onSubmitLevel3: () => void;
  isSubmitting: boolean;
}

function KYCStepForm({
  step,
  onClose,
  formData,
  setFormData,
  files,
  onFileChange,
  onSubmitLevel1,
  onSubmitLevel2,
  onSubmitLevel3,
  isSubmitting
}: KYCStepFormProps) {
  const updateFormData = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  if (step === 1) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Level 1: Basic Information</span>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={formData.firstName || ""}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={formData.lastName || ""}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dateOfBirth || ""}
                onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={formData.gender || ""} onValueChange={(value) => updateFormData("gender", value)}>
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
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onSubmitLevel1} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Level 1"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Level 2 and 3 forms would be similar but with appropriate fields and file uploads
  // Implementation continues with document upload interfaces, etc.

  return null;
}