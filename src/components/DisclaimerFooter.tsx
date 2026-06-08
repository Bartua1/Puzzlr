import { useTranslation } from 'react-i18next';

export const DisclaimerFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full py-2 mt-auto px-4 bg-transparent">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          {t('app.disclaimer')}
        </p>
      </div>
    </footer>
  );
};
