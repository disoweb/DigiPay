import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Shield,
  ArrowRight
} from "lucide-react";

interface VerificationStatusCardProps {
  onStartVerification?: () => void;
}

export function VerificationStatusCard({ onStartVerification }: VerificationStatusCardProps) {
  const { user } = useAuth();

  const { data: kycData, isLoading } = useQuery({
    queryKey: ['/api/kyc'],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading verification status...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = () => {
    switch (kycData?.status) {
      case 'not_started':
        return {
          icon: Shield,
          iconColor: 'text-gray-500',
          badge: { text: 'Not Started', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
          title: 'Identity Verification Required',
          description: 'Complete KYC verification to unlock full trading features and higher limits.',
          showStartButton: true
        };
      case 'in_progress':
        return {
          icon: Clock,
          iconColor: 'text-blue-500',
          badge: { text: 'In Progress', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
          title: 'Verification In Progress',
          description: 'Continue completing your verification steps.',
          showStartButton: true
        };
      case 'submitted':
        return {
          icon: Clock,
          iconColor: 'text-yellow-500',
          badge: { text: 'Under Review', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
          title: 'Verification Under Review',
          description: 'Your documents have been submitted and are being reviewed by our team. This typically takes 24-48 hours.',
          showStartButton: false
        };
      case 'approved':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          badge: { text: 'Verified', variant: 'secondary' as const, className: 'bg-green-100 text-green-800' },
          title: 'Identity Verified',
          description: `Your account was verified on ${kycData?.approvedAt ? new Date(kycData.approvedAt).toLocaleDateString() : 'recently'}. You now have access to all trading features.`,
          showStartButton: false
        };
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          badge: { text: 'Rejected', variant: 'secondary' as const, className: 'bg-red-100 text-red-800' },
          title: 'Verification Rejected',
          description: kycData?.rejectionReason || 'Your verification was rejected. Please contact support or resubmit with corrected information.',
          showStartButton: true
        };
      default:
        return {
          icon: Shield,
          iconColor: 'text-gray-500',
          badge: { text: 'Unknown', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
          title: 'Verification Status Unknown',
          description: 'Unable to determine verification status.',
          showStartButton: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
            KYC Verification
          </div>
          <Badge variant={config.badge.variant} className={config.badge.className}>
            {config.badge.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">{config.title}</h4>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>

        {kycData?.status === 'rejected' && kycData?.rejectionReason && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Rejection Reason:</strong> {kycData.rejectionReason}
            </AlertDescription>
          </Alert>
        )}

        {kycData?.status === 'submitted' && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">What happens next?</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Our team will review your documents within 24-48 hours</li>
              <li>• You'll receive an email notification once verification is complete</li>
              <li>• Your trading limits will be increased automatically</li>
              <li>• You'll gain access to advanced trading features</li>
            </ul>
          </div>
        )}

        {config.showStartButton && onStartVerification && (
          <Button 
            onClick={onStartVerification}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            {kycData?.status === 'rejected' ? 'Restart Verification' : 
             kycData?.status === 'in_progress' ? 'Continue Verification' : 
             'Start Verification'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {kycData?.status === 'approved' && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">All features unlocked</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}