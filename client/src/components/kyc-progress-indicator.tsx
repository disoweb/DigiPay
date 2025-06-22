import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KYCProgressIndicatorProps {
  currentStep: string;
  steps: Array<{
    key: string;
    title: string;
    icon: any;
  }>;
}

export function KYCProgressIndicator({ currentStep, steps }: KYCProgressIndicatorProps) {
  const getCurrentStepIndex = () => steps.findIndex(step => step.key === currentStep);
  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                  isCompleted
                    ? 'bg-green-100 border-green-500 text-green-600'
                    : isCurrent
                    ? 'bg-blue-100 border-blue-500 text-blue-600'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : isCurrent ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              
              <span
                className={`text-xs text-center font-medium ${
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
              
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block absolute h-0.5 w-full top-5 left-1/2 transform -translate-y-1/2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  style={{ zIndex: -1 }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center">
        <Badge variant="outline" className="text-sm">
          Step {currentIndex + 1} of {steps.length}
        </Badge>
      </div>
    </div>
  );
}