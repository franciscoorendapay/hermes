<?php

namespace App\Controller;

use App\Entity\SystemSetting;
use App\Entity\Log;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/settings', priority: 5)]
final class SettingsController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/commission', name: 'app_settings_commission_get', methods: ['GET'])]
    public function getCommission(): JsonResponse
    {
        $setting = $this->em->getRepository(SystemSetting::class)->findOneBy(['settingKey' => 'commission']);

        if (!$setting) {
            return $this->json([
                'type' => 'variable',
                'rate_novos' => 0.07,
                'rate_consolidados' => 0.035,
                'rate_fixed' => 0.05,
            ]);
        }

        $value = $setting->getSettingValue();
        $updatedBy = $setting->getUpdatedBy();

        return $this->json([
            ...$value,
            'updated_at' => $setting->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'updated_by' => $updatedBy ? [
                'id' => $updatedBy->getId(),
                'name' => $updatedBy->getName(),
            ] : null,
        ]);
    }

    #[Route('/commission', name: 'app_settings_commission_update', methods: ['POST', 'PUT'])]
    public function updateCommission(Request $request, #[CurrentUser] ?User $currentUser): JsonResponse
    {
        // Only directors and admins can modify commission settings
        if (!$currentUser) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $userRole = method_exists($currentUser, 'getRole') ? $currentUser->getRole() : null;
        if (!in_array($userRole, ['diretor', 'admin'], true)) {
            return $this->json(['error' => 'Apenas diretores podem alterar as configurações de comissão'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        $type = $data['type'] ?? 'variable';
        if (!in_array($type, ['variable', 'fixed'], true)) {
            return $this->json(['error' => 'type deve ser "variable" ou "fixed"'], Response::HTTP_BAD_REQUEST);
        }

        $newValue = ['type' => $type];

        if ($type === 'variable') {
            $rateNovos = isset($data['rate_novos']) ? (float)$data['rate_novos'] : 0.07;
            $rateConsolidados = isset($data['rate_consolidados']) ? (float)$data['rate_consolidados'] : 0.035;
            $newValue['rate_novos'] = round($rateNovos, 4);
            $newValue['rate_consolidados'] = round($rateConsolidados, 4);
        } else {
            $rateFixed = isset($data['rate_fixed']) ? (float)$data['rate_fixed'] : 0.05;
            $newValue['rate_fixed'] = round($rateFixed, 4);
        }

        // Find or create setting
        $setting = $this->em->getRepository(SystemSetting::class)->findOneBy(['settingKey' => 'commission']);
        $previousValue = $setting ? $setting->getSettingValue() : null;

        if (!$setting) {
            $setting = new SystemSetting();
            $setting->setSettingKey('commission');
        }

        $setting->setSettingValue($newValue);
        $setting->setUpdatedBy($currentUser);
        $setting->setUpdatedAt(new \DateTime());

        $this->em->persist($setting);

        // Audit log
        $log = new Log();
        $log->setUser($currentUser)
            ->setLevel('INFO')
            ->setCategory('settings')
            ->setAction('UPDATE_COMMISSION')
            ->setEntityType('SystemSetting')
            ->setEntityId($setting->getId())
            ->setMessage(sprintf(
                'Configuração de comissão alterada por %s: tipo=%s',
                $currentUser->getName() ?? $currentUser->getEmail(),
                $type
            ))
            ->setContext([
                'previous' => $previousValue,
                'new' => $newValue,
                'changed_by_role' => $userRole,
            ])
            ->setIpAddress($request->getClientIp())
            ->setUserAgent($request->headers->get('User-Agent'));

        $this->em->persist($log);
        $this->em->flush();

        return $this->json([
            ...$newValue,
            'updated_at' => $setting->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            'updated_by' => [
                'id' => $currentUser->getId(),
                'name' => $currentUser->getName(),
            ],
        ]);
    }
}
